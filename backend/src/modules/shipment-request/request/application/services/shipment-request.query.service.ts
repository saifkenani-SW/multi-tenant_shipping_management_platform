import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { ShipmentRequestQueryRepository } from '../../infrastructure/repositories/shipment-request.query.repository';
import { ShipmentRequestQueryDto } from '../dtos/requests/shipment-request-query.dto';
import { ShipmentRequestMergedCriteria } from '../dtos/requests/shipment-request-merged-criteria.interface';
import { ShipmentRequestResponseDto } from '../dtos/responses/shipment-request.response.dto';
import { ShipmentRequestDetailsResponseDto } from '../dtos/responses/shipment-request-details.response.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { ShipmentRequestVisibilityScope } from '../../../authorization/scopes/shipment-request-visibility.scope';
import { AuthorizationFacade } from '../../../../../packages/authorization';
import {
  QuotationQueryService
} from '../../../../shipment-request/quotation/application/services/quotation.query.service';
import { GlobalLocationFacade } from '../../../../global-location/facades/global-location.facade';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';

@Injectable()
export class ShipmentRequestQueryService {
  constructor(
    private readonly queryRepository: ShipmentRequestQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly quotationQueryService: QuotationQueryService,
    private readonly globalLocationFacade: GlobalLocationFacade,
    private readonly tenantFacade: TenantFacade,
  ) {}

  private async enrichShipmentRequests(
    rawRequests: any[],
  ): Promise<ShipmentRequestResponseDto[]> {
    if (rawRequests.length === 0) return [];

    const globalLocationIds = [
      ...new Set(
        rawRequests.flatMap((r) => [
          r.originGlobalLocationId,
          r.destinationGlobalLocationId,
        ]),
      ),
    ] as string[];

    const tenantIds = [
      ...new Set(
        rawRequests.map((r) => r.targetTenantId).filter((id) => id != null),
      ),
    ] as string[];

    const [globalLocations, tenants] = await Promise.all([
      this.globalLocationFacade.getLocationsByIds(globalLocationIds, false),
      this.tenantFacade.getTenantsByIds(tenantIds, false),
    ]);

    const locationMap = new Map(
      globalLocations.map((loc) => [loc.id, loc.name]),
    );
    const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

    return rawRequests.map((record) => ({
      id: record.id,
      customerProfileId: record.customerProfileId,
      targetTenantId: record.targetTenantId ?? null,
      targetTenantName:
        record.targetTenantId && tenantMap.has(record.targetTenantId)
          ? tenantMap.get(record.targetTenantId)!
          : null,
      originGlobalLocationId: record.originGlobalLocationId,
      originGlobalLocationName:
        (locationMap.get(record.originGlobalLocationId) as string) ||
        'Unknown Location',
      destinationGlobalLocationId: record.destinationGlobalLocationId,
      destinationGlobalLocationName:
        (locationMap.get(record.destinationGlobalLocationId) as string) ||
        'Unknown Location',
      senderName: record.senderName,
      senderPhone: record.senderPhone,
      receiverName: record.receiverName,
      receiverPhone: record.receiverPhone,
      expectedPiecesCount: record.expectedPiecesCount,
      expectedTotalWeightKg: Number(record.expectedTotalWeightKg),
      status: record.status,
      approvedQuotationId: record.approvedQuotationId ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async findMany(
    filter: ShipmentRequestQueryDto,
  ): Promise<CursorPaginatedResponse<ShipmentRequestResponseDto>> {
    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    // --- Validate filter against mandatory scope constraints ---
    if (scope.request?.customer_profile_id && filter.customerProfileId) {
      if (filter.customerProfileId !== scope.request.customer_profile_id) {
        throw new ForbiddenException(
          'You can only filter by your own customer profile.',
        );
      }
    }

    if (scope.request?.target_tenant_id && filter.targetTenantId) {
      if (filter.targetTenantId !== scope.request.target_tenant_id) {
        throw new ForbiddenException('You can only filter by your own tenant.');
      }
    }

    // --- Merge scope + filter into one unified criteria ---
    const mergedCriteria: ShipmentRequestMergedCriteria = {
      customerProfileId:
        scope.request?.customer_profile_id ?? filter.customerProfileId,
      targetTenantId: scope.request?.target_tenant_id ?? filter.targetTenantId,
      originGlobalLocationId: filter.originGlobalLocationId,
      destinationGlobalLocationId: filter.destinationGlobalLocationId,
      senderPhone: filter.senderPhone,
      receiverPhone: filter.receiverPhone,
      status: filter.status,
      // Quotation-level scope constraints (e.g. EMPLOYEE sees only requests
      // that have a quotation from one of their org units).
      quotationTenantId: scope.quotation?.tenant_id,
      quotationOrgUnitIds: scope.quotation?.origin_org_unit_ids,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    const result = await this.queryRepository.findMany(mergedCriteria);
    const enriched = await this.enrichShipmentRequests(result.data as any[]);

    return new CursorPaginatedResponse(enriched, result.meta);
  }

  async findDetailsById(
    id: string,
  ): Promise<ShipmentRequestDetailsResponseDto> {
    const rawRequest = await this.findById(id);

    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    const [enrichedRequest] = await this.enrichShipmentRequests([rawRequest]);
    const quotations = await this.quotationQueryService.findByShipmentRequestId(
      id,
      scope,
    );

    return {
      ...enrichedRequest,
      quotations,
    };
  }

  async findById(id: string): Promise<any> {
    const rawRequest = await this.queryRepository.findById(id);

    if (!rawRequest) {
      throw new NotFoundException(
        'Shipment request not found or you do not have permission to view it.',
      );
    }

    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    if (scope.request?.customer_profile_id) {
      if (rawRequest.customerProfileId !== scope.request.customer_profile_id) {
        throw new NotFoundException(
          'Shipment request not found or you do not have permission to view it.',
        );
      }
    }

    // A tenant/employee can see the request if:
    // 1. It's directed to their tenant
    // 2. It's a public request (targetTenantId is null)
    // 3. They have submitted a quotation for it
    if (scope.request?.target_tenant_id || scope.quotation?.tenant_id || scope.quotation?.origin_org_unit_ids) {
      const isTargetedToThem = rawRequest.targetTenantId === scope.request?.target_tenant_id;

      if (!isTargetedToThem) {
        // We must check if they have a quotation for this request to grant access.
        const quotations = await this.quotationQueryService.findByShipmentRequestId(
          id,
          scope, // This will automatically filter quotations to their scope
        );

        if (quotations.length === 0) {
          throw new NotFoundException(
            'Shipment request not found or you do not have permission to view it.',
          );
        }
      }
    }

    return rawRequest;
  }
}
