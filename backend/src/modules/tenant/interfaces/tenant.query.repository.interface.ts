import { Tenant } from '../domain/tenant.entity';
import { TenantQueryCriteria } from '../builders/query/tenant-query-criteria';

export interface ITenantQueryRepository {
  findMany(criteria: TenantQueryCriteria): Promise<[Tenant[], number]>;
  findById(id: string): Promise<Tenant | null>;
}
