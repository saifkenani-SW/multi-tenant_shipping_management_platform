import { AbilityBuilder, createMongoAbility, subject } from '@casl/ability';
import { ApplicationAbility } from '../../../../../authorization/application-ability';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';
import { TenantAction } from '../actions/tenant.action';
import { TenantSubject } from '../subjects/tenant.subject';
import { TenantAbility } from './tenant.ability';

describe('TenantAbility', () => {
  it('should allow platform administrators to view and manage tenant lifecycle states', () => {
    const builder = new AbilityBuilder<ApplicationAbility>(createMongoAbility);
    const principal: Principal = {
      subject: { id: 'admin-id', type: SubjectType.PLATFORM_OWNER },
      branches: [],
      warehouses: [],
    };

    new TenantAbility().contribute(builder, principal);
    const ability = builder.build();
    const suspendedTenant = subject(TenantSubject, {
      id: 'tenant-id',
      status: 'SUSPENDED',
    });

    expect(ability.can(TenantAction.View, suspendedTenant)).toBe(true);
    expect(ability.can(TenantAction.Suspend, suspendedTenant)).toBe(true);
    expect(ability.can(TenantAction.Activate, suspendedTenant)).toBe(true);
  });

  it('should not grant lifecycle permissions to tenant-scoped principals', () => {
    const builder = new AbilityBuilder<ApplicationAbility>(createMongoAbility);
    const principal: Principal = {
      subject: { id: 'employee-id', type: SubjectType.EMPLOYEE },
      tenantId: 'tenant-id',
      branches: [],
      warehouses: [],
    };

    new TenantAbility().contribute(builder, principal);
    const ability = builder.build();
    const tenant = subject(TenantSubject, { id: 'tenant-id' });

    expect(ability.can(TenantAction.Suspend, tenant)).toBe(false);
    expect(ability.can(TenantAction.Activate, tenant)).toBe(false);
  });
});
