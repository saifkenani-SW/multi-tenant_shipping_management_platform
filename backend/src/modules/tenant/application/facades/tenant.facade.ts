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

  async getMaxBranchesAllowed(tenantId: string): Promise<number> {
    const subscription =
      await this.tenantQueryService.getTenantSubscription(tenantId);
    return subscription?.snapshotMaxBranches ?? 0;
  }

  async getMaxWarehousesAllowed(tenantId: string): Promise<number> {
    const subscription =
      await this.tenantQueryService.getTenantSubscription(tenantId);
    return subscription?.snapshotMaxWarehouses ?? 0;
  }

  async getMaxEmployeesAllowed(tenantId: string): Promise<number> {
    const subscription =
      await this.tenantQueryService.getTenantSubscription(tenantId);
    return subscription?.snapshotMaxEmployees ?? 0;
  }
}
