import { Injectable } from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { TransportManifestCommandRepository } from '../../infrastructure/repositories/transport-manifest-command.repository';
import { ManifestQueryService } from './manifest-query.service';
import { TripQueryService } from '../../../trip/application/services/trip-query.service';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestItemStatus } from '../../domain/enums/manifest-item-status.enum';
import { InvalidManifestOrgUnitsException } from '../../domain/exceptions/invalid-manifest-org-units.exception';
import { DuplicateManifestParcelException } from '../../domain/exceptions/duplicate-manifest-parcel.exception';
import { ParcelAlreadyInActiveManifestException } from '../../domain/exceptions/parcel-already-in-active-manifest.exception';
import { TripAlreadyDepartedException } from '../../domain/exceptions/trip-already-departed.exception';
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
    private readonly manifestQueryService: ManifestQueryService,
    private readonly tripQueryService: TripQueryService,
    private readonly organizationFacade: OrganizationFacade,
  ) {}

  /**
   * Creates a PENDING manifest for a trip that has not departed yet.
   *
   * The trip is Fleet-owned, so it is read through the sibling trip query
   * service. Organization units are external and go through OrganizationFacade.
   */
  @Transactional()
  async createManifest(
    tenantId: string,
    dto: CreateManifestDto,
  ): Promise<string> {
    TransportManifest.assertRouteIsValid(
      dto.originOrgUnitId,
      dto.destinationOrgUnitId,
    );

    const trip = await this.tripQueryService.findTripOrThrow(
      tenantId,
      dto.tripId,
    );

    if (!trip.acceptsManifestChanges()) {
      throw new TripAlreadyDepartedException();
    }

    const allExist =
      await this.organizationFacade.validateOrganizationUnitsExist(tenantId, [
        dto.originOrgUnitId,
        dto.destinationOrgUnitId,
      ]);

    if (!allExist) {
      throw new InvalidManifestOrgUnitsException();
    }

    const manifest = TransportManifest.create({
      tenantId,
      tripId: dto.tripId,
      originOrgUnitId: dto.originOrgUnitId,
      destinationOrgUnitId: dto.destinationOrgUnitId,
    });

    const created = await this.commandRepository.create(manifest);

    return created.id;
  }

  /**
   * Adds a parcel to a manifest.
   *
   * The parcel itself is never read: no module owns the parcel table yet, and
   * the manifest_item foreign key rejects unknown parcel ids at write time.
   * What is checked here are the Fleet-owned invariants — the manifest must
   * still accept changes, the parcel must not already be on this manifest, and
   * it must not be committed to another active manifest.
   */
  @Transactional()
  async addItem(
    tenantId: string,
    manifestId: string,
    dto: AddManifestItemDto,
  ): Promise<string> {
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

    manifest.assertItemsModifiable();

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

    const item = ManifestItem.create({
      manifestId,
      parcelId: dto.parcelId,
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

  /** Removes a parcel from a manifest that is still PENDING. */
  @Transactional()
  async removeItem(
    tenantId: string,
    manifestId: string,
    itemId: string,
  ): Promise<void> {
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

    manifest.assertItemsModifiable();

    await this.manifestQueryService.findItemOrThrow(manifestId, itemId);

    await this.commandRepository.deleteItem(itemId);
  }

  /** IN_TRANSIT -> COMPLETED. Terminal: the manifest becomes immutable. */
  @Transactional()
  async completeManifest(tenantId: string, manifestId: string): Promise<void> {
    const manifest = await this.manifestQueryService.findManifestOrThrow(
      tenantId,
      manifestId,
    );

    manifest.complete();

    await this.commandRepository.updateStatus(manifestId, manifest.status);
  }

  /**
   * Moves every PENDING manifest of a departing trip to IN_TRANSIT.
   * Called by the trip sub-domain as part of the same transaction as the
   * trip's own transition.
   */
  async markTripManifestsInTransit(
    tenantId: string,
    tripId: string,
  ): Promise<void> {
    await this.commandRepository.markTripManifestsInTransit(tenantId, tripId);
  }

  /** Exposed for readability at call sites that only need the enum. */
  static readonly ItemStatus = ManifestItemStatus;
}
