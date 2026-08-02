import { Injectable } from '@nestjs/common';
import { TenantQueryService } from '../services/tenant.query.service';

@Injectable()
export class TenantFacade {
  constructor(private readonly tenantQueryService: TenantQueryService) {}

  /**
   * Checks if a user is an owner of a specific tenant.
   */
  async isTenantOwner(tenantId: string, userId: string): Promise<boolean> {
    return this.tenantQueryService.isTenantOwner(tenantId, userId);
  }

  async getTenantSettings(tenantId: string) {
    return this.tenantQueryService.getTenantSettings(tenantId);
  }
}
