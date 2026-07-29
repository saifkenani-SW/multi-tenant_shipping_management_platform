import { Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/tenant.entity';
import { TenantDetailsDto } from '../../dtos/responses/tenant-details.dto';
import {
  PaginatedTenantListDto,
  TenantListDto,
} from '../../dtos/responses/tenant-list.dto';
import { Pagination, PaginationMeta } from '../../../../common/pagination';

@Injectable()
export class TenantResponseMapper {
  toListDto(tenant: Tenant): TenantListDto {
    const dto = new TenantListDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.logoUrl = tenant.logoUrl;
    dto.status = tenant.status;
    dto.createdAt = tenant.createdAt;
    return dto;
  }

  toDetailsDto(tenant: Tenant): TenantDetailsDto {
    const dto = new TenantDetailsDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.status = tenant.status;
    dto.taxNumber = tenant.taxNumber;
    dto.email = tenant.email;
    dto.phone = tenant.phone;
    dto.logoUrl = tenant.logoUrl;
    dto.createdAt = tenant.createdAt;
    dto.updatedAt = tenant.updatedAt;
    dto.suspendedAt = tenant.suspendedAt;
    dto.suspendedReason = tenant.suspendedReason;
    return dto;
  }

  toPaginatedListDto(
    tenants: Tenant[],
    total: number,
    pagination: Pagination,
  ): PaginatedTenantListDto {
    const dto = new PaginatedTenantListDto();
    dto.data = tenants.map((tenant) => this.toListDto(tenant));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
