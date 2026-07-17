import { TenantSearchField } from '../enums/tenant-search-field.enum';
import { Tenant } from '../domain/tenant.entity';

export interface ITenantQueryRepository {
  findMany(
    skip: number,
    take: number,
    search?: string,
    searchType?: TenantSearchField,
  ): Promise<[Tenant[], number]>;
  findById(id: string): Promise<Tenant | null>;
}
