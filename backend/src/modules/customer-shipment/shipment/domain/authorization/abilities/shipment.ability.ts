import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';

import { ShipmentAction } from '../actions/shipment.action';
import { ShipmentSubject } from '../subjects/shipment.subject';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../../../packages/authorization-casl';
import { ApplicationAbility } from '../../../../../../authorization/application-ability';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';

@CaslContributor()
@Injectable()
export class ShipmentAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      builder.can(ShipmentAction.Create, ShipmentSubject);
      builder.can(ShipmentAction.View, ShipmentSubject);
      builder.can(ShipmentAction.Update, ShipmentSubject);
      builder.can(ShipmentAction.Cancel, ShipmentSubject);
      return;
    }

    // A customer only ever sees the shipments they sent.
    if (type === SubjectType.CUSTOMER) {
      if (principal.profileId) {
        builder.can(ShipmentAction.View, ShipmentSubject, {
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
      builder.can(ShipmentAction.Create, ShipmentSubject, ownTenant);
      builder.can(ShipmentAction.View, ShipmentSubject, ownTenant);
      builder.can(ShipmentAction.Update, ShipmentSubject, ownTenant);
      builder.can(ShipmentAction.Cancel, ShipmentSubject, ownTenant);
      return;
    }

    if (type === SubjectType.EMPLOYEE) {
      builder.can(ShipmentAction.Create, ShipmentSubject, ownTenant);
      builder.can(ShipmentAction.View, ShipmentSubject, ownTenant);
      builder.can(ShipmentAction.Update, ShipmentSubject, ownTenant);
      builder.can(ShipmentAction.Cancel, ShipmentSubject, ownTenant);
    }
  }
}
