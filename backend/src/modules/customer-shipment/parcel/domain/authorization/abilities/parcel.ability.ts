import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';

import { ParcelAction } from '../actions/parcel.action';
import { ParcelSubject } from '../subjects/parcel.subject';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../../../packages/authorization-casl';
import { ApplicationAbility } from '../../../../../../authorization/application-ability';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';
import { Permission } from '../../../../../../core/security/Permission';
import { ParcelStatus } from '@prisma/client';

@CaslContributor()
@Injectable()
export class ParcelAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      builder.can(ParcelAction.View, ParcelSubject);
      return;
    }

    // Customers see parcels via tracking.
    // The query layer joins `customer_shipment` to expose sender_phone and receiver_phone.
    if (type === SubjectType.CUSTOMER) {
      if (principal.phone) {
        builder.can(ParcelAction.View, ParcelSubject, {
          sender_phone: principal.phone,
        } as any);
        builder.can(ParcelAction.View, ParcelSubject, {
          receiver_phone: principal.phone,
        } as any);
      }
      return;
    }

    if (!principal.tenantId) {
      return;
    }

    const ownTenant = { tenant_id: principal.tenantId } as any;

    if (type === SubjectType.TENANT_ADMIN) {
      builder.can(ParcelAction.View, ParcelSubject, ownTenant);
      builder.can(ParcelAction.UpdateStatus, ParcelSubject, ownTenant);
      builder.can(ParcelAction.Receive, ParcelSubject, ownTenant);
      builder.can(ParcelAction.Dispatch, ParcelSubject, ownTenant);
      builder.can(ParcelAction.Collect, ParcelSubject, ownTenant);
      return;
    }

    // A driver reads parcels and never changes them: moving a parcel through
    // its lifecycle is branch work. What a driver does change is the parcel's
    // place on a manifest, which lives in Fleet and is guarded there.
    //
    // The scope is the tenant rather than an org unit, because a driver's job
    // is to move between units — tying them to one would block scanning the
    // parcels they are carrying to the next branch.
    if (type === SubjectType.DRIVER) {
      builder.can(ParcelAction.View, ParcelSubject, ownTenant);
      return;
    }

    if (type === SubjectType.EMPLOYEE) {
      const orgUnits = [
        ...(principal.branches || []),
        ...(principal.warehouses || []),
      ];

      for (const orgUnit of orgUnits) {
        const perms = orgUnit.role?.permissions || [];

        // A parcel is visible/updatable if it belongs to the tenant AND is currently at
        // OR destined for the employee's org unit.

        const currentOrgScope = {
          tenant_id: principal.tenantId,
          current_org_unit_id: orgUnit.id,
        } as any;

        const destOrgScope = {
          tenant_id: principal.tenantId,
          destination_org_unit_id: orgUnit.id,
        } as any;

        if (perms.includes(Permission.READ_PARCEL)) {
          builder.can(ParcelAction.View, ParcelSubject, currentOrgScope);
          builder.can(ParcelAction.View, ParcelSubject, destOrgScope);
        }

        if (perms.includes(Permission.UPDATE_PARCEL)) {
          builder.can(
            ParcelAction.UpdateStatus,
            ParcelSubject,
            currentOrgScope,
          );
        }

        if (perms.includes(Permission.RECEIVE_PARCEL)) {
          builder.can(ParcelAction.Receive, ParcelSubject, {
            ...currentOrgScope,
            current_status: ParcelStatus.ARRIVED_AT_UNIT,
          });
        }

        if (perms.includes(Permission.DISPATCH_PARCEL)) {
          builder.can(ParcelAction.Dispatch, ParcelSubject, {
            ...currentOrgScope,
            current_status: ParcelStatus.PROCESSING,
          });
        }

        if (perms.includes(Permission.COLLECT_PARCEL)) {
          builder.can(ParcelAction.Collect, ParcelSubject, {
            ...currentOrgScope,
            current_status: ParcelStatus.READY_FOR_COLLECTION,
          });
        }
      }
      return;
    }
  }
}
