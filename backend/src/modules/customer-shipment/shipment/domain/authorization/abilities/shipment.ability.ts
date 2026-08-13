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
import { Permission } from '../../../../../../core/security/Permission';

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
      builder.can(ShipmentAction.View, ShipmentSubject);
      return;
    }

    if (type === SubjectType.TENANT_ADMIN) {
      if (principal.tenantId) {
        builder.can(ShipmentAction.View, ShipmentSubject, {
          tenant_id: principal.tenantId,
        } as any);
      }
      return;
    }

    if (type === SubjectType.CUSTOMER) {
      builder.can(ShipmentAction.View, ShipmentSubject, {
        sender_phone: principal.phone,
      } as any);
      builder.can(ShipmentAction.View, ShipmentSubject, {
        receiver_phone: principal.phone,
      } as any);

      return;
    }

    if (type === SubjectType.EMPLOYEE) {
      const orgUnits = [
        ...(principal.branches || []),
        ...(principal.warehouses || []),
      ];

      for (const orgUnit of orgUnits) {
        const perms = orgUnit.role?.permissions || [];
        const mutateScope = {
          tenant_id: principal.tenantId,
          origin_org_unit_id: orgUnit.id,
        } as any;

        if (perms.includes(Permission.CREATE_SHIPMENT)) {
          builder.can(ShipmentAction.Create, ShipmentSubject, mutateScope);
        }

        if (perms.includes(Permission.READ_SHIPMENT)) {
          builder.can(ShipmentAction.View, ShipmentSubject, {
            tenant_id: principal.tenantId,
            origin_org_unit_id: orgUnit.id,
          } as any);
          builder.can(ShipmentAction.View, ShipmentSubject, {
            tenant_id: principal.tenantId,
            destination_org_unit_id: orgUnit.id,
          } as any);
        }

        if (perms.includes(Permission.UPDATE_SHIPMENT)) {
          builder.can(ShipmentAction.Update, ShipmentSubject, mutateScope);
        }

        if (perms.includes(Permission.CANCEL_SHIPMENT)) {
          builder.can(ShipmentAction.Cancel, ShipmentSubject, mutateScope);
        }

        if (perms.includes(Permission.RETURN_SHIPMENT)) {
          builder.can(ShipmentAction.Return, ShipmentSubject, mutateScope);
        }
      }
    }
  }
}
