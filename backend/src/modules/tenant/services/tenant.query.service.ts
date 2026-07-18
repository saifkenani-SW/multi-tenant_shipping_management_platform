import { Injectable, Inject } from '@nestjs/common';
import { ITenantQueryService } from '../interfaces/tenant.query.service.interface';
import type { ITenantQueryRepository } from '../interfaces/tenant.query.repository.interface';
import {
  PaginatedTenantListDto,
  TenantListDto,
} from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import { TenantSearchField } from '../enums/tenant-search-field.enum';

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
    result.data = items.map((tenant) => {
      const dto = new TenantListDto();
      dto.id = tenant.id;
      dto.name = tenant.name;
      dto.status = tenant.status;
      dto.createdAt = tenant.createdAt;
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
    result.status = tenant.status;
    result.taxNumber = tenant.taxNumber;
    result.contactEmail = tenant.contactEmail;
    result.createdAt = tenant.createdAt;
    result.updatedAt = tenant.updatedAt;

    return result;
  }
}
