import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
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
import { AddManifestItemDto } from '../dtos/requests/add-manifest-item.dto';
import {
  ManifestItemTargetStatus,
  UpdateManifestItemStatusDto,
} from '../dtos/requests/update-manifest-item-status.dto';

@Injectable()
export class ManifestCommandService {
  constructor(
    private readonly commandRepository: TransportManifestCommandRepository,
    private readonly queryRepository: TransportManifestQueryRepository,
    private readonly manifestQueryService: ManifestQueryService,
    private readonly organizationFacade: OrganizationFacade,
    private readonly employeeFacade: EmployeeFacade,
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
  async addItem(
    tenantId: string,
    manifestId: string,
    employeeId: string | undefined,
    dto: AddManifestItemDto,
  ): Promise<string> {
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

    manifest.assertItemsModifiable();

    await this.assertEmployeeCanEditManifest(employeeId, manifest);

    if (
      await this.manifestQueryService.existsItemForParcel(
        manifestId,
        dto.parcelId,
      )
    ) {
      throw new DuplicateManifestParcelException();
    }

    if (
      await this.manifestQueryService.isParcelInActiveManifest(
        tenantId,
        dto.parcelId,
        manifestId,
      )
    ) {
      throw new ParcelAlreadyInActiveManifestException();
    }

    let adderName: string | null = null;
    if (employeeId) {
      adderName = await this.employeeFacade.getEmployeeName(employeeId);
    }

    const item = ManifestItem.create({
      manifestId,
      parcelId: dto.parcelId,
      addedByEmployeeId: employeeId ?? null,
      addedByEmployeeName: adderName,
    });

    const created = await this.commandRepository.createItem(item);

    return created.id;
  }

  /**
   * Moves one parcel through its own lifecycle. The item entity decides whether
   * the requested transition is legal.
   */
  @Transactional()
  async updateItemStatus(
    tenantId: string,
    manifestId: string,
    itemId: string,
    dto: UpdateManifestItemStatusDto,
  ): Promise<void> {
    await this.manifestQueryService.findManifestOrThrow(tenantId, manifestId);

    const item = await this.manifestQueryService.findItemOrThrow(
      manifestId,
      itemId,
    );

    switch (dto.status) {
      case ManifestItemTargetStatus.LOADED:
        item.markLoaded();
        break;
      case ManifestItemTargetStatus.UNLOADED:
        item.markUnloaded();
        break;
      case ManifestItemTargetStatus.MISSING:
        item.markMissing();
        break;
    }

    await this.commandRepository.updateItemStatus(itemId, item.status, {
      loadedAt: item.loadedAt,
      unloadedAt: item.unloadedAt,
    });
  }

  /** Removes a parcel from a manifest that is still OPEN. */
  @Transactional()
  async removeItem(
    tenantId: string,
    manifestId: string,
    itemId: string,
    employeeId: string | undefined,
  ): Promise<void> {
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

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
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

    await this.assertEmployeeCanEditManifest(employeeId, manifest);

    const items = await this.manifestQueryService.getManifestItems(
      tenantId,
      manifestId,
    );

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
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

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
