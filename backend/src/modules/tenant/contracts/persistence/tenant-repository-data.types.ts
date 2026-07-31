import { Tenant } from '../../domain/entities/tenant.entity';

export type CreateTenantRepositoryData = Pick<
  Tenant,
  'name' | 'taxNumber' | 'email'
>;

export type UpdateTenantRepositoryData = Partial<CreateTenantRepositoryData>;
