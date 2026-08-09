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
      builder.can(ParcelAction.UpdateStatus, ParcelSubject);
      return;
    }

    // A customer sees parcels only through the shipments they sent; the
    // ownership check happens on the owning shipment, which the query layer
    // joins in.
    if (type === SubjectType.CUSTOMER) {
      if (principal.profileId) {
        builder.can(ParcelAction.View, ParcelSubject, {
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
      builder.can(ParcelAction.View, ParcelSubject, ownTenant);
      builder.can(ParcelAction.UpdateStatus, ParcelSubject, ownTenant);
      return;
    }

    if (type === SubjectType.EMPLOYEE) {
      builder.can(ParcelAction.View, ParcelSubject, ownTenant);
      builder.can(ParcelAction.UpdateStatus, ParcelSubject, ownTenant);
      return;
    }

    if (type === SubjectType.DRIVER) {
      builder.can(ParcelAction.View, ParcelSubject, ownTenant);
    }
  }
}
