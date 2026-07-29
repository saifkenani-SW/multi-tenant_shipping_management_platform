import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  CapabilityBuilder,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { Role } from '../../domain/role.entity';
import { RoleAction } from '../actions/role.action';
import { RoleSubject } from '../subjects/role.subject';
import { RoleCapabilities } from './role.capabilities.interface';

/**
 * يُقيَّم على الكيان لا على الـ DTO: شرط { tenantId } في RoleAbility
 * موجود على Role وليس على RoleDetailsDto بالضرورة.
 */
@Injectable()
export class RoleCapabilityBuilder implements CapabilityBuilder<
  Role,
  RoleCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: Role,
    context: AuthorizationContext<Principal>,
  ): RoleCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const roleSubject = subject(RoleSubject, entity);

    return {
      canUpdate: ability.can(RoleAction.Update, roleSubject),
      canDelete: ability.can(RoleAction.Delete, roleSubject),
      canManagePermissions: ability.can(
        RoleAction.ManagePermissions,
        roleSubject,
      ),
    };
  }
}
