import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { InvoiceQueryRepository } from '../../infrastructure/repositories/invoice.query.repository';
import { InvoiceQueryDto } from '../dtos/requests/invoice-query.dto';
import type { InvoiceMergedCriteria } from '../dtos/requests/invoice-merged-criteria.interface';
import { InvoiceResponseDto } from '../dtos/responses/invoice.response.dto';
import { InvoiceDetailsResponseDto } from '../dtos/responses/invoice-details.response.dto';
import { InvoiceMapper } from '../mappers/invoice.mapper';

/**
 * Read side of billing.
 *
 * An invoice has no visibility rules of its own: whoever may see a shipment may
 * see its invoice. Reaching one invoice therefore goes through the shipment
 * controller, which has already authorised the shipment.
 *
 * Listing is the exception. Searching across many invoices has no single
 * shipment to start from, so this service applies the equivalent constraints
 * directly — tenant isolation, and for staff the branches they are assigned to.
 */
@Injectable()
export class InvoiceQueryService {
  constructor(
    private readonly queryRepository: InvoiceQueryRepository,
    private readonly mapper: InvoiceMapper,
    private readonly requestContext: RequestContextService,
  ) {}

  async findMany(
    filter: InvoiceQueryDto,
  ): Promise<CursorPaginatedResponse<InvoiceResponseDto>> {
    const merged = this.buildCriteria(filter);
    const result = await this.queryRepository.findMany(merged);

    return new CursorPaginatedResponse(
      (result.data as any[]).map((row) => this.mapper.toResponse(row)),
      result.meta,
    );
  }

  /** Invoice with its full payment history. */
  async findDetailsById(id: string): Promise<InvoiceDetailsResponseDto> {
    const record = await this.findRawWithinScope(id);
    const payments = await this.queryRepository.findPayments(id);

    return this.mapper.toDetails(record, payments);
  }

  /**
   * The invoice belonging to a shipment.
   *
   * Called after the shipment module has authorised the shipment itself, so no
   * further check is applied here — that authorisation is the check.
   */
  async findByShipmentId(
    customerShipmentId: string,
  ): Promise<InvoiceDetailsResponseDto> {
    const record =
      await this.queryRepository.findRawByShipmentId(customerShipmentId);

    if (!record) {
      throw new NotFoundException('This shipment has no invoice');
    }

    const payments = await this.queryRepository.findPayments(record.id);

    return this.mapper.toDetails(record, payments);
  }

  async findById(id: string): Promise<InvoiceResponseDto> {
    const record = await this.findRawWithinScope(id);
    return this.mapper.toResponse(record);
  }

  /**
   * Builds the constraints for a list query.
   *
   * A filter may narrow what the caller is allowed to see, but a filter that
   * contradicts it is refused rather than quietly dropped — otherwise a caller
   * would believe they had searched the whole set.
   */
  private buildCriteria(filter: InvoiceQueryDto): InvoiceMergedCriteria {
    const principal = this.requestContext.getPrincipal();
    const type = principal.subject.type;

    const base: InvoiceMergedCriteria = {
      status: filter.status,
      senderPhone: filter.senderPhone,
      customerShipmentId: filter.customerShipmentId,
      paymentResponsibility: filter.paymentResponsibility,
      orgUnitId: filter.orgUnitId,
      issuedFrom: filter.issuedFrom,
      issuedTo: filter.issuedTo,
      dueBefore: filter.dueBefore,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    // The platform owner carries no tenant and reads across every tenant.
    if (type === SubjectType.PLATFORM_OWNER) {
      return { ...base, tenantId: filter.tenantId };
    }

    const tenantId = principal.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(
        'A tenant context is required to list invoices.',
      );
    }

    if (filter.tenantId && filter.tenantId !== tenantId) {
      throw new ForbiddenException('You can only filter by your own tenant.');
    }

    if (type === SubjectType.TENANT_ADMIN) {
      return { ...base, tenantId };
    }

    // Staff see the invoices of the branches they work at, at either end of
    // the route: the branch that took the shipment in and the branch that
    // hands it over both deal with the paperwork.
    const assignedOrgUnitIds = [
      ...(principal.branches?.map((b) => b.id) || []),
      ...(principal.warehouses?.map((w) => w.id) || []),
    ];

    if (filter.orgUnitId && !assignedOrgUnitIds.includes(filter.orgUnitId)) {
      throw new ForbiddenException(
        'You can only filter by a branch you are assigned to.',
      );
    }

    return {
      ...base,
      tenantId,
      orgUnitId: filter.orgUnitId,
      scopedOrgUnitIds: filter.orgUnitId ? undefined : assignedOrgUnitIds,
    };
  }

  /**
   * A lookup by id bypasses the list filters, so the same constraints are
   * re-applied here. Not-found rather than forbidden, so the endpoint never
   * confirms that an invoice of another tenant exists.
   */
  private async findRawWithinScope(id: string): Promise<any> {
    const record = await this.queryRepository.findRawById(id);

    if (!record) {
      throw new NotFoundException('Invoice not found');
    }

    const principal = this.requestContext.getPrincipal();
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      return record;
    }

    if (record.tenant_id !== principal.tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    if (type === SubjectType.TENANT_ADMIN) {
      return record;
    }

    const assignedOrgUnitIds = [
      ...(principal.branches?.map((b) => b.id) || []),
      ...(principal.warehouses?.map((w) => w.id) || []),
    ];

    const touchesAssignedBranch =
      assignedOrgUnitIds.includes(record.origin_org_unit_id) ||
      assignedOrgUnitIds.includes(record.destination_org_unit_id);

    if (!touchesAssignedBranch) {
      throw new NotFoundException('Invoice not found');
    }

    return record;
  }
}
