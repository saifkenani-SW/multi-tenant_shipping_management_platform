import { UpdateTenantDto } from '../../../../application/dtos/requests/update-tenant.dto';

export interface UpdateTenantPayload {
  tenantId: string;
  dto: UpdateTenantDto;
}
