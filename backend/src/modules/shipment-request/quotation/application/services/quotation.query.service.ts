import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuotationQueryRepository } from '../../infrastructure/repositories/quotation.query.repository';
import { QuotationResponseDto } from '../dtos/responses/quotation.response.dto';
import { QuotationQueryDto } from '../dtos/requests/quotation-query.dto';
import { QuotationMergedCriteria } from '../dtos/requests/quotation-merged-criteria.interface';
import { ShipmentRequestVisibilityScope } from '../../../authorization/scopes/shipment-request-visibility.scope';
import { ShipmentRequestScopeInterface } from '../../../authorization/scopes/shipment-request-scope.interface';
import { AuthorizationFacade } from '../../../../../packages/authorization';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';

@Injectable()
export class QuotationQueryService {
  constructor(
    private readonly queryRepository: QuotationQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly tenantFacade: TenantFacade,
    private readonly organizationFacade: OrganizationFacade,
  ) {}

  private async enrichQuotations(
    rawQuotations: any[],
  ): Promise<QuotationResponseDto[]> {
    if (rawQuotations.length === 0) return [];

    const tenantIds = [
      ...new Set(rawQuotations.map((q) => q.tenant_id)),
    ] as string[];
    const orgUnitIds = [
      ...new Set(
        rawQuotations.flatMap((q) => [
          q.origin_org_unit_id,
          q.destination_org_unit_id,
        ]),
      ),
    ] as string[];

    const [tenants, orgUnits] = await Promise.all([
      this.tenantFacade.getTenantsByIds(tenantIds, false),
      this.organizationFacade.getOrganizationUnitsByIds(orgUnitIds, false),
    ]);

    const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));
    const orgUnitMap = new Map(orgUnits.map((o) => [o.id, o.name]));

    return rawQuotations.map((q) => ({
      id: q.id,
      tenantId: q.tenant_id,
      tenantName: tenantMap.get(q.tenant_id) ?? 'Unknown Tenant',
      shipmentRequestId: q.shipment_request_id,
      originOrgUnitId: q.origin_org_unit_id,
      originOrgUnitName:
        orgUnitMap.get(q.origin_org_unit_id) ?? 'Unknown Branch',
      destinationOrgUnitId: q.destination_org_unit_id,
      destinationOrgUnitName:
        orgUnitMap.get(q.destination_org_unit_id) ?? 'Unknown Branch',
      serviceLevel: q.service_level,
      quotationType: q.quotation_type,
      basePrice: Number(q.base_price),
      weightCharge: Number(q.weight_charge),
      extraFees: Number(q.extra_fees),
      amount: Number(q.amount),
      pricingSnapshot: q.pricing_snapshot,
      status: q.status,
      createdAt: q.created_at,
    }));
  }

  async findMany(
    filter: QuotationQueryDto,
  ): Promise<CursorPaginatedResponse<QuotationResponseDto>> {
    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    // --- Validate filter against mandatory scope ---
    if (scope.quotation?.tenant_id && filter.tenantId) {
      if (filter.tenantId !== scope.quotation.tenant_id) {
        throw new ForbiddenException('You can only filter by your own tenant.');
      }
    }

    if (scope.quotation?.origin_org_unit_ids && filter.originOrgUnitId) {
      if (
        !scope.quotation.origin_org_unit_ids.includes(filter.originOrgUnitId)
      ) {
        throw new ForbiddenException(
          'You can only filter by your own organization unit.',
        );
      }
    }

    // --- Merge scope + filter ---
    const mergedCriteria: QuotationMergedCriteria = {
      tenantId: scope.quotation?.tenant_id ?? filter.tenantId,
      originOrgUnitId:
        scope.quotation?.origin_org_unit_ids?.length === 1
          ? scope.quotation.origin_org_unit_ids[0]
          : filter.originOrgUnitId,
      destinationOrgUnitId: filter.destinationOrgUnitId,
      serviceLevel: filter.serviceLevel,
      status: filter.status,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    // When employee has multiple org units and filtered to one, use that
    if (
      scope.quotation?.origin_org_unit_ids &&
      scope.quotation.origin_org_unit_ids.length > 1 &&
      filter.originOrgUnitId
    ) {
      mergedCriteria.originOrgUnitId = filter.originOrgUnitId;
    }

    const result = await this.queryRepository.findMany(mergedCriteria);

    const enriched = await this.enrichQuotations(result.data as any[]);
    return new CursorPaginatedResponse(enriched, result.meta);
  }

  async findById(id: string): Promise<QuotationResponseDto> {
    const raw = await this.queryRepository.findById(id);
    if (!raw) {
      throw new NotFoundException(
        'Quotation not found or you do not have permission to view it.',
      );
    }

    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    if (scope.quotation?.tenant_id) {
      if (raw.tenant_id !== scope.quotation.tenant_id) {
        throw new NotFoundException(
          'Quotation not found or you do not have permission to view it.',
        );
      }
    }

    if (
      scope.quotation?.origin_org_unit_ids &&
      scope.quotation.origin_org_unit_ids.length > 0
    ) {
      if (
        !scope.quotation.origin_org_unit_ids.includes(raw.origin_org_unit_id)
      ) {
        throw new NotFoundException(
          'Quotation not found or you do not have permission to view it.',
        );
      }
    }

    const [enriched] = await this.enrichQuotations([raw]);
    return enriched;
  }

  async findByShipmentRequestId(
    shipmentRequestId: string,
    scope: ShipmentRequestScopeInterface,
  ): Promise<QuotationResponseDto[]> {
    const rawQuotations =
      await this.queryRepository.findByShipmentRequestId(shipmentRequestId);

    const filtered = rawQuotations.filter((q) => {
      if (scope.quotation?.tenant_id) {
        if (q.tenant_id !== scope.quotation.tenant_id) return false;
      }
      if (
        scope.quotation?.origin_org_unit_ids &&
        scope.quotation.origin_org_unit_ids.length > 0
      ) {
        if (!scope.quotation.origin_org_unit_ids.includes(q.origin_org_unit_id))
          return false;
      }
      return true;
    });

    return this.enrichQuotations(filtered);
  }
}
