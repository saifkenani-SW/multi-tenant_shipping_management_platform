import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TransportManifestQueryRepository } from '../../infrastructure/repositories/transport-manifest-query.repository';
import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestNotFoundException } from '../../domain/exceptions/manifest-not-found.exception';
import { ManifestItemNotFoundException } from '../../domain/exceptions/manifest-item-not-found.exception';
import { ManifestQueryDto } from '../dtos/requests/manifest-query.dto';
import { ManifestDetailsDto } from '../dtos/responses/manifest-details.dto';
import { ManifestItemDto } from '../dtos/responses/manifest-item.dto';
import { PaginatedManifestListDto } from '../dtos/responses/manifest-list.dto';
import { ManifestResponseMapper } from '../mappers/manifest-response.mapper';
import { ManifestQueryCriteria } from '../builders/query/manifest-query-criteria';
import { OffsetPaginationBuilder } from '../../../../../common/pagination';
import {
  AuthorizationFacade,
  Authorize,
} from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ManifestVisibilityScope } from '../../domain/authorization/scopes/manifest-visibility.scope';
import { ManifestPolicy } from '../../domain/authorization/policies/manifest.policy';
import { ManifestAction } from '../../domain/authorization/actions/manifest.action';
import { CustomerShipmentFacade } from '../../../../customer-shipment/facades/customer-shipment.facade';

import { OrganizationFacade } from '../../../../organization/facades/organization.facade';

@Injectable()
export class ManifestQueryService {
  constructor(
    private readonly queryRepository: TransportManifestQueryRepository,
    private readonly responseMapper: ManifestResponseMapper,
    private readonly parcelLookup: CustomerShipmentFacade,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly organizationFacade: OrganizationFacade,
  ) {}

  async findManifests(
    tenantId: string | undefined,
    query: ManifestQueryDto,
  ): Promise<PaginatedManifestListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: ManifestVisibilityScope,
    });

    if (tenantId && scope?.tenantId && tenantId !== scope.tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const criteria: ManifestQueryCriteria = {
      tenantId: scope?.tenantId || tenantId || query.tenantId,
      scopeOrgUnitIds: scope?.orgUnitIds,
      driverId: scope?.driverId || query.driverId,
      status: query.status,
      tripId: query.tripId,
      originOrgUnitId: query.originOrgUnitId,
      destinationOrgUnitId: query.destinationOrgUnitId,
      pagination: OffsetPaginationBuilder.build(query),
    };

    const [records, total] = await this.queryRepository.findMany(criteria);

    if (!records.length) {
      return this.responseMapper.toPaginatedListDto(
        records,
        total,
        criteria.pagination,
        scope,
        {},
      );
    }

    const orgUnitNamesMap = await this.resolveOrgUnitNames(
      records.map((r) => r.manifest),
    );

    return this.responseMapper.toPaginatedListDto(
      records,
      total,
      criteria.pagination,
      scope,
      orgUnitNamesMap,
    );
  }

  @Authorize({
    policy: Policy(ManifestPolicy, ManifestAction.View),
    payloadResolver: (id: string) => ({ id }),
  })
  async getManifestDetails(id: string): Promise<ManifestDetailsDto> {
    const manifest = await this.findManifestOrThrow(id);
    const items = await this.queryRepository.findItems(id);
    
    const orgUnitNamesMap = await this.resolveOrgUnitNames([manifest]);

    return this.responseMapper.toDetailsDto(
      manifest,
      items,
      await this.loadParcels(items),
      orgUnitNamesMap[manifest.originOrgUnitId],
      orgUnitNamesMap[manifest.destinationOrgUnitId],
    );
  }

  @Authorize({
    policy: Policy(ManifestPolicy, ManifestAction.View),
    payloadResolver: (manifestId: string) => ({ id: manifestId }),
  })
  async getManifestItems(manifestId: string): Promise<ManifestItemDto[]> {
    await this.findManifestOrThrow(manifestId);
    const items = await this.queryRepository.findItems(manifestId);
    const parcels = await this.loadParcels(items);

    return items.map((item) =>
      this.responseMapper.toItemDto(item, parcels.get(item.parcelId)),
    );
  }

  /**
   * Returns manifests in READY_FOR_DISPATCH state with no trip linked.
   * Used by the GET /manifests/available endpoint.
   */
  async findAvailableForBooking(tenantId: string) {
    return this.queryRepository.findAvailable(tenantId);
  }

  private async loadParcels(items: ManifestItem[]): Promise<Map<string, any>> {
    if (items.length === 0) return new Map();

    try {
      const parcels = await this.parcelLookup.getParcelsByIds(
        items.map((item) => item.parcelId),
      );

      return new Map(parcels.map((parcel) => [parcel.id, parcel]));
    } catch {
      return new Map();
    }
  }

  private async resolveOrgUnitNames(
    manifests: TransportManifest[],
  ): Promise<Record<string, string>> {
    const orgUnitIds = [
      ...new Set(
        manifests.flatMap((m) => [m.originOrgUnitId, m.destinationOrgUnitId]),
      ),
    ];

    if (orgUnitIds.length === 0) return {};

    const orgUnits =
      await this.organizationFacade.getOrganizationUnitsByIds(orgUnitIds);

    return orgUnits.reduce(
      (map, orgUnit) => {
        map[orgUnit.id] = orgUnit.name;
        return map;
      },
      {} as Record<string, string>,
    );
  }

  async findManifestOrThrow(id: string): Promise<TransportManifest> {
    const manifest = await this.queryRepository.findById(id);

    if (!manifest) {
      throw new ManifestNotFoundException();
    }

    return manifest;
  }

  async findItemOrThrow(
    manifestId: string,
    itemId: string,
  ): Promise<ManifestItem> {
    const item = await this.queryRepository.findItemById(manifestId, itemId);

    if (!item) {
      throw new ManifestItemNotFoundException();
    }

    return item;
  }

  async areParcelsInActiveManifest(
    tenantId: string,
    parcelIds: string[],
    excludeManifestId?: string,
  ): Promise<boolean> {
    return this.queryRepository.areParcelsInActiveManifest(
      tenantId,
      parcelIds,
      excludeManifestId,
    );
  }
  async existsItemsForParcels(
    manifestId: string,
    parcelIds: string[],
  ): Promise<boolean> {
    return this.queryRepository.existsItemsForParcels(manifestId, parcelIds);
  }

  /**
   * Scans a tracking number to find its active manifest item.
   * Ensures the parcel is in an active manifest in this tenant, and the user has access to it.
   */
  async scanParcel(
    tenantId: string,
    trackingNumber: string,
  ): Promise<{ manifestId: string; itemId: string }> {
    // 1. Resolve parcel ID bypassing CustomerShipment authorization (since caller is Driver scanning physical barcode)
    const parcelId =
      await this.parcelLookup.getParcelIdByTrackingNumber(trackingNumber);

    // 2. Find the active manifest item holding this parcel in this tenant
    const item = await this.queryRepository.findActiveItemByParcelIdAndTenant(
      parcelId,
      tenantId,
    );

    if (!item) {
      throw new NotFoundException(
        'Parcel is not assigned to any active manifest',
      );
    }

    // 3. Authorize via existing getManifestDetails to ensure the user can see it
    // (e.g. they are the assigned driver, or an employee with matching org scope)
    await this.getManifestDetails(item.manifestId);

    return {
      manifestId: item.manifestId,
      itemId: item.itemId,
    };
  }
}
