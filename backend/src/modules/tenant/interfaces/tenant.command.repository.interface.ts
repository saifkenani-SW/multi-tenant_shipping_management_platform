import { TenantStatus } from '../enums/tenant-status.enum';
import { Tenant } from '../domain/tenant.entity';

export interface ITenantCommandRepository {
  create(data: {
    name: string;
    taxNumber: string;
    contactEmail: string;
  }): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  update(
    id: string,
    data: { name?: string; taxNumber?: string; contactEmail?: string },
  ): Promise<void>;
  updateStatus(
    id: string,
    status: TenantStatus,
    reason?: string,
  ): Promise<void>;
}
