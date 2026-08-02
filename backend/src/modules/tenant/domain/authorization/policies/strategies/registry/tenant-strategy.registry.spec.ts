import { TenantAction } from '../../../actions/tenant.action';
import { TenantStrategyRegistry } from './tenant-strategy.registry';

describe('TenantStrategyRegistry', () => {
  it('should register suspend and activate strategies', () => {
    const createStrategy = { action: TenantAction.Create };
    const updateStrategy = { action: TenantAction.Update };
    const deleteStrategy = { action: TenantAction.Delete };
    const viewStrategy = { action: TenantAction.View };
    const suspendStrategy = { action: TenantAction.Suspend };
    const activateStrategy = { action: TenantAction.Activate };
    const manageSubscriptionStrategy = {
      action: TenantAction.ManageSubscription,
    };

    const registry = new TenantStrategyRegistry(
      createStrategy as any,
      updateStrategy as any,
      deleteStrategy as any,
      viewStrategy as any,
      suspendStrategy as any,
      activateStrategy as any,
      manageSubscriptionStrategy as any,
    );

    expect(registry.get(TenantAction.Suspend)).toBe(suspendStrategy);
    expect(registry.get(TenantAction.Activate)).toBe(activateStrategy);
  });
});
