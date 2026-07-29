import { UpdateTenantDto } from '../../../dtos/requests/update-tenant.dto';

export interface UpdateTenantPayload {
  tenantId: string;
  dto: UpdateTenantDto;
}
