import { Injectable, Inject } from '@nestjs/common';
import { ITenantQueryService } from '../interfaces/tenant.query.service.interface';
import type { ITenantQueryRepository } from '../interfaces/tenant.query.repository.interface';
import { PaginatedTenantListDto, TenantListDto } from '../dtos/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/tenant-details.dto';
import { TenantSearchField } from '../dtos/tenant-query.dto';

@Injectable()
export class TenantQueryService implements ITenantQueryService {
  constructor(
    @Inject('ITenantQueryRepository')
    private readonly tenantQueryRepository: ITenantQueryRepository,
  ) {}

  async findTenants(
    page: number,
    limit: number,
    search?: string,
    searchType?: TenantSearchField,
  ): Promise<PaginatedTenantListDto> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.tenantQueryRepository.findMany(
      skip,
      limit,
      search,
      searchType,
    );

    const result = new PaginatedTenantListDto();
    result.data = items.map((tenant: any) => {
      const dto = new TenantListDto();
      dto.id = tenant.id;
      dto.name = tenant.name;
      dto.status = tenant.is_active ? 'ACTIVE' : 'SUSPENDED';
      dto.createdAt = tenant.created_at;
      return dto;
    });
    result.meta = {
      page,
      limit,
      total,
    };

    return result;
  }

  async getTenantDetails(id: string): Promise<TenantDetailsDto | null> {
    const tenant = await this.tenantQueryRepository.findById(id);

    if (!tenant) return null;

    const result = new TenantDetailsDto();
    result.id = tenant.id;
    result.name = tenant.name;
    result.status = tenant.is_active ? 'ACTIVE' : 'SUSPENDED';
    result.taxNumber = tenant.tax_number || '';
    result.contactEmail = tenant.email || '';
    result.createdAt = tenant.created_at;
    result.updatedAt = tenant.updated_at;

    return result;
  }
}
