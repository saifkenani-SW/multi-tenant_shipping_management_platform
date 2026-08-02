import { CustomerShipmentQueryCriteria } from './customer-shipment-query-criteria';
import { CustomerShipmentQueryDto } from '../../dtos/requests/customer-shipment-query.dto';
import { CursorPaginationBuilder } from '../../../../../common/pagination/cursor/builders/cursor-pagination.builder';
import { CursorPagination } from '../../../../../common/pagination/cursor/value-objects/cursor-pagination';

export class CustomerShipmentQueryCriteriaBuilder {
  private criteria: CustomerShipmentQueryCriteria;

  constructor() {
    this.criteria = new CustomerShipmentQueryCriteria();
  }

  static fromDto(
    dto: CustomerShipmentQueryDto,
  ): CustomerShipmentQueryCriteriaBuilder {
    const builder = new CustomerShipmentQueryCriteriaBuilder();

    // Base pagination mapping
    builder.withPagination(CursorPaginationBuilder.build(dto));

    if (dto.tenantId) {
      builder.withTenantId(dto.tenantId);
    }

    if (dto.senderCustomerProfileId) {
      builder.withSenderCustomerProfile(dto.senderCustomerProfileId);
    }

    if (dto.receiverCustomerProfileId) {
      builder.withReceiverCustomerProfile(dto.receiverCustomerProfileId);
    }

    if (dto.status) {
      builder.withStatus(dto.status);
    }

    if (dto.search) {
      builder.withSearch(dto.search);
    }

    return builder;
  }

  withPagination(pagination: CursorPagination): this {
    this.criteria.pagination = pagination;
    return this;
  }

  withTenantId(tenantId: string): this {
    this.criteria.tenantId = tenantId;
    return this;
  }

  withSenderCustomerProfile(senderCustomerProfileId: string): this {
    this.criteria.senderCustomerProfileId = senderCustomerProfileId;
    return this;
  }

  withReceiverCustomerProfile(receiverCustomerProfileId: string): this {
    this.criteria.receiverCustomerProfileId = receiverCustomerProfileId;
    return this;
  }

  withStatus(status: any): this {
    this.criteria.status = status;
    return this;
  }

  withSearch(search: string): this {
    this.criteria.search = search;
    return this;
  }

  build(): CustomerShipmentQueryCriteria {
    return this.criteria;
  }
}
