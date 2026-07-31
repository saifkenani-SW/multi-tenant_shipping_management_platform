import { Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  CapabilityBuilder,
  AuthorizationContext,
} from '../../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../../packages/authorization-casl';

import { TenantAction } from '../actions/tenant.action';
import { TenantSubject } from '../subjects/tenant.subject';
import { TenantDetailsDto } from '../../../application/dtos/responses/tenant-details.dto';
import { TenantCapabilities } from './tenant.capabilities.interface';
import { Principal } from '../../../../../packages/context/principal/principal/Principal';

@Injectable()
export class TenantCapabilityBuilder implements CapabilityBuilder<
  TenantDetailsDto,
  TenantCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: TenantDetailsDto,
    context: AuthorizationContext<Principal>,
  ): TenantCapabilities {
    // 1. بناء الصلاحيات للمستخدم الحالي
    const ability = this.abilityFactory.create(context.principal);

    // 2. تغليف الكيان (Plain Object) ليتمكن CASL من فهمه
    const tenantSubject = subject(TenantSubject, entity);

    // 3. ترجمة قواعد CASL إلى واجهة Capabilities
    return {
      canUpdate: ability.can(TenantAction.Update, tenantSubject),
      canDelete: ability.can(TenantAction.Delete, tenantSubject),
    };
  }
}
