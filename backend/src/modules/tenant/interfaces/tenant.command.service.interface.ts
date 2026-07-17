import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';

export interface ITenantCommandService {
  createTenant(dto: CreateTenantDto): Promise<string>;
  updateTenant(id: string, dto: UpdateTenantDto): Promise<void>;
  suspendTenant(id: string, reason?: string): Promise<void>;
  activateTenant(id: string): Promise<void>;
}
