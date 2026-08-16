import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { EmployeeFacade } from '../../../../employee2/facades/employee.facade';
import { TransportManifestCommandRepository } from '../../infrastructure/repositories/transport-manifest-command.repository';
import { TransportManifestQueryRepository } from '../../infrastructure/repositories/transport-manifest-query.repository';
import { ManifestQueryService } from './manifest-query.service';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestItemStatus } from '../../domain/enums/manifest-item-status.enum';
import { ManifestNotFinalizableException } from '../../domain/exceptions/manifest-not-finalizable.exception';
import { InvalidManifestOrgUnitsException } from '../../domain/exceptions/invalid-manifest-org-units.exception';
import { DuplicateManifestParcelException } from '../../domain/exceptions/duplicate-manifest-parcel.exception';
import { ParcelAlreadyInActiveManifestException } from '../../domain/exceptions/parcel-already-in-active-manifest.exception';
import { CreateManifestDto } from '../dtos/requests/create-manifest.dto';
import { AddManifestItemsDto } from '../dtos/requests/add-manifest-items.dto';
import { CustomerShipmentFacade } from '../../../../customer-shipment/facades/customer-shipment.facade';
import {
  ManifestItemTargetStatus,
  UpdateManifestItemStatusDto,
} from '../dtos/requests/update-manifest-item-status.dto';
import { ManifestStatus } from '../../domain/enums/manifest-status.enum';

@Injectable()
export class ManifestCommandService {
  constructor(
    private readonly commandRepository: TransportManifestCommandRepository,
    private readonly queryRepository: TransportManifestQueryRepository,
    private readonly manifestQueryService: ManifestQueryService,
    private readonly organizationFacade: OrganizationFacade,
    private readonly employeeFacade: EmployeeFacade,
    private readonly customerShipmentFacade: CustomerShipmentFacade,
  ) {}

  /**
   * Creates a standalone OPEN manifest (no trip attached).
   *
   * The employee who creates the manifest is recorded for audit. Org units are
   * validated through OrganizationFacade.
   */
  @Transactional()
  async createManifest(
    tenantId: string,
    employeeId: string | undefined,
    dto: CreateManifestDto,
  ): Promise<string> {
    TransportManifest.assertRouteIsValid(
      dto.originOrgUnitId,
      dto.destinationOrgUnitId,
    );

    const allExist =
      await this.organizationFacade.validateOrganizationUnitsExist(tenantId, [
        dto.originOrgUnitId,
        dto.destinationOrgUnitId,
      ]);

    if (!allExist) {
      throw new InvalidManifestOrgUnitsException();
    }

    if (employeeId) {
      const assigned = await this.employeeFacade.isAssignedToOrgUnit(
        employeeId,
        dto.originOrgUnitId,
      );

      if (!assigned) {
        throw new ForbiddenException(
          'You are not assigned to the origin organization unit of this manifest',
        );
      }
    }

    let creatorName: string | null = null;
    if (employeeId) {
      creatorName = await this.employeeFacade.getEmployeeName(employeeId);
    }

    const manifest = TransportManifest.create({
      tenantId,
      originOrgUnitId: dto.originOrgUnitId,
      destinationOrgUnitId: dto.destinationOrgUnitId,
      createdByEmployeeId: employeeId ?? null,
      createdByEmployeeName: creatorName,
    });

    const created = await this.commandRepository.create(manifest);

    return created.id;
  }

  /**
   * Adds a parcel to a manifest.
   *
   * Enforces: manifest must be OPEN, the parcel must not already be on this
   * manifest, the parcel must not be committed to another active manifest, and
   * the employee must be assigned to the manifest's origin org unit.
   */
  @Transactional()
  async addItems(
    tenantId: string,
    manifestId: string,
    employeeId: string | undefined,
    parcelIds: string[],
  ): Promise<string[]> {
    if (parcelIds.length === 0) return [];

    const manifest =
      await this.manifestQueryService.findManifestOrThrow(manifestId);
    if (manifest.tenantId !== tenantId) throw new ForbiddenException();

    manifest.assertItemsModifiable();

    await this.assertEmployeeCanEditManifest(employeeId, manifest);

    // Validate all parcels in bulk
    if (await this.manifestQueryService.existsItemsForParcels(manifestId, parcelIds)) {
      throw new DuplicateManifestParcelException();
    }

    if (await this.manifestQueryService.areParcelsInActiveManifest(tenantId, parcelIds, manifestId)) {
      throw new ParcelAlreadyInActiveManifestException();
    }

    let adderName: string | null = null;
    if (employeeId) {
      adderName = await this.employeeFacade.getEmployeeName(employeeId);
    }

    const items = parcelIds.map((parcelId) =>
      ManifestItem.create({
        manifestId,
        parcelId,
        addedByEmployeeId: employeeId ?? null,
        addedByEmployeeName: adderName,
      }),
    );

    await this.commandRepository.createItems(items);

    // Call the customer shipment facade to process parcels in bulk
    await this.customerShipmentFacade.markParcelsReadyForDispatch(parcelIds);

    return items.map((item) => item.id);
  }

  /**
   * Moves one manifest item through its lifecycle and keeps both the parcel
   * status and the manifest status in sync.
   *
   * LOADED:
   *   - Parcel            → IN_TRANSIT  (via CustomerShipmentFacade)
   *   - Manifest ASSIGNED → LOADING     (first scan)
   *   - Manifest LOADING  → IN_TRANSIT  (last scan, no PENDING_LOAD remaining)
   *
   * UNLOADED:
   *   - Parcel            → ARRIVED_AT_UNIT (via CustomerShipmentFacade)
   *   - Manifest IN_TRANSIT → COMPLETED (last unload, no LOADED remaining)
   *
   * MISSING:
   *   - No parcel or manifest status change. Reported for investigation.
   */
  @Transactional()
  async updateItemStatus(
    tenantId: string,
    manifestId: string,
    itemId: string,
    dto: UpdateManifestItemStatusDto,
  ): Promise<void> {
    const manifest =
      await this.manifestQueryService.findManifestOrThrow(manifestId);
    if (manifest.tenantId !== tenantId) throw new ForbiddenException();

    // Guard: validate manifest is in the right state for this item transition
    manifest.assertItemStatusUpdatable(dto.status);

    const item = await this.manifestQueryService.findItemOrThrow(
      manifestId,
      itemId,
    );

    switch (dto.status) {
      case ManifestItemTargetStatus.LOADED: {
        item.markLoaded();
        await this.commandRepository.updateItemStatus(itemId, item.status, {
          loadedAt: item.loadedAt,
          unloadedAt: null,
        });

        // Parcel → IN_TRANSIT
        await this.customerShipmentFacade.markParcelLoadedOnManifest(
          item.parcelId,
          manifest.tripId!,
        );

        // Manifest: ASSIGNED → LOADING on first scan
        if (manifest.status === ManifestStatus.ASSIGNED) {
          manifest.startLoading();
          await this.commandRepository.updateStatus(manifestId, manifest.status);
        }

        // Manifest: LOADING → IN_TRANSIT when no PENDING_LOAD items remain
        // Uses commandRepository (Prisma/transactional) to read within the same
        // transaction and see the just-written LOADED status.
        const pendingCount = await this.commandRepository.countItemsByStatus(
          manifestId,
          ManifestItemStatus.PENDING_LOAD,
        );
        if (pendingCount === 0) {
          manifest.completeLoading();
          await this.commandRepository.updateStatus(manifestId, manifest.status);
        }
        break;
      }

      case ManifestItemTargetStatus.UNLOADED: {
        item.markUnloaded();
        await this.commandRepository.updateItemStatus(itemId, item.status, {
          loadedAt: item.loadedAt,
          unloadedAt: item.unloadedAt,
        });

        // Parcel → ARRIVED_AT_UNIT (with updated org unit location)
        await this.customerShipmentFacade.markParcelUnloadedFromManifest(
          item.parcelId,
          manifest.destinationOrgUnitId,
          manifest.tripId ?? undefined,
        );

        // Manifest: IN_TRANSIT → COMPLETED when no LOADED items remain
        // Uses commandRepository (Prisma/transactional) to read within the same
        // transaction and see the just-written UNLOADED status.
        const loadedCount = await this.commandRepository.countItemsByStatus(
          manifestId,
          ManifestItemStatus.LOADED,
        );
        if (loadedCount === 0) {
          manifest.markCompleted();
          await this.commandRepository.updateStatus(manifestId, manifest.status);
        }
        break;
      }

      case ManifestItemTargetStatus.MISSING: {
        item.markMissing();
        await this.commandRepository.updateItemStatus(itemId, item.status, {
          loadedAt: item.loadedAt,
          unloadedAt: null,
        });
        // No parcel or manifest status change — reported for investigation
        break;
      }
    }
  }

  /** Removes a parcel from a manifest that is still OPEN. */
  @Transactional()
  async removeItem(
    tenantId: string,
    manifestId: string,
    itemId: string,
    employeeId: string | undefined,
  ): Promise<void> {
    const manifest =
      await this.manifestQueryService.findManifestOrThrow(manifestId);
    if (manifest.tenantId !== tenantId) throw new ForbiddenException();

    manifest.assertItemsModifiable();

    await this.assertEmployeeCanEditManifest(employeeId, manifest);

    await this.manifestQueryService.findItemOrThrow(manifestId, itemId);

    await this.commandRepository.deleteItem(itemId);
  }

  /**
   * OPEN → READY_FOR_DISPATCH.
   *
   * Requires at least one item on the manifest. Enforces employee scope.
   */
  @Transactional()
  async finalizeManifest(
    tenantId: string,
    manifestId: string,
    employeeId: string | undefined,
  ): Promise<void> {
    const manifest =
      await this.manifestQueryService.findManifestOrThrow(manifestId);
    if (manifest.tenantId !== tenantId) throw new ForbiddenException();

    await this.assertEmployeeCanEditManifest(employeeId, manifest);

    const items = await this.manifestQueryService.getManifestItems(manifestId);

    if (!items.length) {
      throw new ManifestNotFinalizableException(
        'Cannot finalize a manifest with no items',
      );
    }

    manifest.finalize();

    await this.commandRepository.updateStatus(manifestId, manifest.status);
  }

  /**
   * READY_FOR_DISPATCH → OPEN.
   *
   * Only allowed when no trip has been linked yet. Enforces employee scope.
   */
  @Transactional()
  async reopenManifest(
    tenantId: string,
    manifestId: string,
    employeeId: string | undefined,
  ): Promise<void> {
    const manifest =
      await this.manifestQueryService.findManifestOrThrow(manifestId);
    if (manifest.tenantId !== tenantId) throw new ForbiddenException();

    await this.assertEmployeeCanEditManifest(employeeId, manifest);

    manifest.reopen();

    await this.commandRepository.updateStatus(manifestId, manifest.status);
  }

  /**
   * Links a list of bookable manifests to a trip.
   *
   * Validation: all requested manifests must exist in this tenant, be in
   * READY_FOR_DISPATCH status, and have no trip yet. A race-condition guard
   * verifies the update count matches the requested count.
   */
  @Transactional()
  async assignManifestsToTrip(
    tenantId: string,
    tripId: string,
    manifestIds: string[],
  ): Promise<void> {
    if (!manifestIds.length) return;

    const bookable = await this.queryRepository.findBookableByIdsAndTenant(
      manifestIds,
      tenantId,
    );

    if (bookable.length !== manifestIds.length) {
      throw new ConflictException(
        'One or more manifests are not available for assignment (wrong status, wrong tenant, or already linked to a trip)',
      );
    }

    const updated = await this.commandRepository.linkToTrip(
      manifestIds,
      tripId,
      tenantId,
    );

    if (updated !== manifestIds.length) {
      throw new ConflictException(
        'Manifest assignment conflict: some manifests were claimed by another trip concurrently',
      );
    }
  }

  /**
   * Bulk: READY_FOR_DISPATCH → IN_TRANSIT when trip departs.
   * Called by TripCommandService as part of the same transaction.
   */
  async markTripManifestsInTransit(
    tenantId: string,
    tripId: string,
  ): Promise<void> {
    await this.commandRepository.markTripManifestsInTransit(tenantId, tripId);
  }

  /**
   * Bulk: IN_TRANSIT → COMPLETED when trip completes.
   * Called by TripCommandService as part of the same transaction.
   */
  async markTripManifestsCompleted(
    tenantId: string,
    tripId: string,
  ): Promise<void> {
    await this.commandRepository.markTripManifestsCompleted(tenantId, tripId);
  }

  static readonly ItemStatus = ManifestItemStatus;

  /**
   * Scope guard: the employee must be assigned to the manifest's origin
   * org unit. TENANT_ADMIN callers pass employeeId = undefined (unrestricted).
   */
  private async assertEmployeeCanEditManifest(
    employeeId: string | undefined,
    manifest: TransportManifest,
  ): Promise<void> {
    if (!employeeId) return;

    const assigned = await this.employeeFacade.isAssignedToOrgUnit(
      employeeId,
      manifest.originOrgUnitId,
    );

    if (!assigned) {
      throw new ForbiddenException(
        'You are not assigned to the origin organization unit of this manifest',
      );
    }
  }
}
