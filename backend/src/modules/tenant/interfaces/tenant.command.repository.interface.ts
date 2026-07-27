import { TenantStatus } from '../enums/tenant-status.enum';
import { Tenant } from '../domain/tenant.entity';
import {
  CreateTenantRepositoryData,
  UpdateTenantRepositoryData,
} from '../contracts/persistence/tenant-repository-data.types';

export interface ITenantCommandRepository {
  create(data: CreateTenantRepositoryData): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  update(id: string, data: UpdateTenantRepositoryData): Promise<void>;
  updateStatus(
    id: string,
    status: TenantStatus,
    reason?: string,
  ): Promise<void>;
}
