import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';

import { TenantAction } from '../actions/tenant.action';
import { TenantSubject } from '../subjects/tenant.subject';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../../packages/authorization-casl';
import { ApplicationAbility } from '../../../../../authorization/application-ability';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../packages/context/principal/principal/SubjectType';

@CaslContributor()
@Injectable()
export class TenantAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    if (principal.subject.type === SubjectType.CUSTOMER) {
      return;
    }

    if (principal.subject.type === SubjectType.PLATFORM_OWNER) {
      builder.can(TenantAction.Create, TenantSubject);
      builder.can(TenantAction.Update, TenantSubject);
      builder.can(TenantAction.Suspend, TenantSubject);
      builder.can(TenantAction.Activate, TenantSubject);
      builder.can(TenantAction.ManageSubscription, TenantSubject);
      builder.can(TenantAction.View, TenantSubject);
      return;
    }

    if (principal.tenantId) {
      const tenantCondition = { id: principal.tenantId } as any;

      builder.can(TenantAction.Update, TenantSubject, tenantCondition);
      builder.can(TenantAction.Delete, TenantSubject, tenantCondition);
      // Allow viewing their own tenant
      builder.can(TenantAction.View, TenantSubject, tenantCondition);
    }
  }
}
