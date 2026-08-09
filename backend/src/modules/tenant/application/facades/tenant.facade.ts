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

  async getTenantDetails(tenantId: string) {
    return this.tenantQueryService.getTenantDetails(tenantId);
  }

  async getTenantsByIds(tenantIds: string[], activeOnly: boolean = false) {
    return this.tenantQueryService.findByIds(tenantIds, activeOnly);
  }

  async getTenantSettings(tenantId: string) {
    return this.tenantQueryService.getTenantSettings(tenantId);
  }

  async getTenantPricingSettings(tenantId: string) {
    const settings = await this.tenantQueryService.getTenantSettings(tenantId);
    return settings?.pricing;
  }

  async getTenantPricingSettingsBatch(tenantIds: string[]) {
    if (!tenantIds || tenantIds.length === 0) return new Map();

    const uniqueIds = [...new Set(tenantIds)];
    const settingsList =
      await this.tenantQueryService.getTenantPricingSettingsBatch(uniqueIds);

    const map = new Map<string, any>();
    for (const s of settingsList) {
      map.set(s.tenantId, s);
    }
    return map;
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
