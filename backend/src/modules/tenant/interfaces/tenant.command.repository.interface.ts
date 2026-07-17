import { TenantStatus } from '../enums/tenant-status.enum';

export interface TenantData {
  id: string;
  name: string;
  status: TenantStatus;
  taxNumber: string;
  contactEmail: string;
}

export interface ITenantCommandRepository {
  create(data: Omit<TenantData, 'id' | 'status'>): Promise<string>;
  findById(id: string): Promise<TenantData | null>;
  update(
    id: string,
    data: Partial<Omit<TenantData, 'id' | 'status'>>,
  ): Promise<void>;
  updateStatus(
    id: string,
    status: TenantStatus,
    reason?: string,
  ): Promise<void>;
}
