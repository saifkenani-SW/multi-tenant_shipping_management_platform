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
import { ShipmentStatus } from '@prisma/client';

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
          tenantId: principal.tenantId,
        } as any);
      }
      return;
    }

    if (type === SubjectType.CUSTOMER) {
      builder.can(ShipmentAction.View, ShipmentSubject, {
        senderPhone: principal.phone,
      } as any);
      builder.can(ShipmentAction.View, ShipmentSubject, {
        receiverPhone: principal.phone,
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
          tenantId: principal.tenantId,
          originOrgUnitId: orgUnit.id,
        } as any;

        if (perms.includes(Permission.CREATE_SHIPMENT)) {
          builder.can(ShipmentAction.Create, ShipmentSubject, mutateScope);
        }

        if (perms.includes(Permission.READ_SHIPMENT)) {
          builder.can(ShipmentAction.View, ShipmentSubject, {
            tenantId: principal.tenantId,
            originOrgUnitId: orgUnit.id,
          } as any);
          builder.can(ShipmentAction.View, ShipmentSubject, {
            tenantId: principal.tenantId,
            destinationOrgUnitId: orgUnit.id,
          } as any);
        }

        if (perms.includes(Permission.UPDATE_SHIPMENT)) {
          builder.can(ShipmentAction.Update, ShipmentSubject, {
            ...mutateScope,
            status: {
              $in: [ShipmentStatus.PENDING, ShipmentStatus.PROCESSING],
            },
          });
        }

        if (perms.includes(Permission.CANCEL_SHIPMENT)) {
          builder.can(ShipmentAction.Cancel, ShipmentSubject, {
            ...mutateScope,
            status: {
              $in: [ShipmentStatus.PENDING, ShipmentStatus.PROCESSING],
            },
          });
        }

        if (perms.includes(Permission.RETURN_SHIPMENT)) {
          builder.can(ShipmentAction.Return, ShipmentSubject, {
            ...mutateScope,
            status: ShipmentStatus.IN_TRANSIT,
          });
        }
      }
    }
  }
}
