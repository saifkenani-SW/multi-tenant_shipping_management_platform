import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  CapabilityBuilder,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { Permission } from '../../domain/permission.entity';
import { PermissionAction } from '../actions/permission.action';
import { PermissionSubject } from '../subjects/permission.subject';
import { PermissionCapabilities } from './permission.capabilities.interface';

/**
 * يُقيَّم على الكيان (Permission) لا على الـ DTO، حتى تُقرأ شروط CASL
 * على نفس الشكل الذي تراه الاستراتيجيات.
 */
@Injectable()
export class PermissionCapabilityBuilder implements CapabilityBuilder<
  Permission,
  PermissionCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: Permission,
    context: AuthorizationContext<Principal>,
  ): PermissionCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const permissionSubject = subject(PermissionSubject, entity);

    return {
      canView: ability.can(PermissionAction.View, permissionSubject),
    };
  }
}
