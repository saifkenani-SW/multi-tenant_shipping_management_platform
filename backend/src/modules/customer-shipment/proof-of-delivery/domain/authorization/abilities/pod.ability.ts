import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';

import { PodAction } from '../actions/pod.action';
import { PodSubject } from '../subjects/pod.subject';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../../../packages/authorization-casl';
import { ApplicationAbility } from '../../../../../../authorization/application-ability';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';

@CaslContributor()
@Injectable()
export class PodAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      builder.can(PodAction.Record, PodSubject);
      builder.can(PodAction.View, PodSubject);
      return;
    }

    // A customer may see the proof for their own shipment but never record it.
    if (type === SubjectType.CUSTOMER) {
      if (principal.profileId) {
        builder.can(PodAction.View, PodSubject, {
          sender_customer_profile_id: principal.profileId,
        } as any);
      }
      return;
    }

    if (!principal.tenantId) {
      return;
    }

    const ownTenant = { tenant_id: principal.tenantId } as any;

    if (type === SubjectType.TENANT_ADMIN) {
      builder.can(PodAction.View, PodSubject, ownTenant);
      return;
    }

    if (type === SubjectType.EMPLOYEE) {
      builder.can(PodAction.Record, PodSubject, ownTenant);
      builder.can(PodAction.View, PodSubject, ownTenant);
    }
  }
}
