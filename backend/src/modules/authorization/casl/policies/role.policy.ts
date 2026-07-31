import { subject } from '@casl/ability';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  AccessDeniedException,
  AuthorizationContext,
  AuthorizationPolicy,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { CreateRoleDto } from '../../role/dtos/requests/create-role.dto';
import { SetRolePermissionsDto } from '../../role/dtos/requests/set-role-permissions.dto';
import { UpdateRoleDto } from '../../role/dtos/requests/update-role.dto';
import type { IRoleQueryRepository } from '../../role/interfaces/role.query.repository.interface';
import { ROLE_QUERY_REPOSITORY_TOKEN } from '../../role/tokens/role-repository.tokens';
import { RoleAction } from '../actions/role.action';
import { RoleSubject } from '../subjects/role.subject';

export interface CreateRolePayload {
  dto: CreateRoleDto;
}
export interface ViewRolePayload {
  roleId?: string;
}
export interface UpdateRolePayload {
  roleId: string;
  dto: UpdateRoleDto;
}
export interface DeleteRolePayload {
  roleId: string;
}
export interface ManageRolePermissionsPayload {
  roleId: string;
  dto: SetRolePermissionsDto;
}

type RolePayload =
  | CreateRolePayload
  | ViewRolePayload
  | UpdateRolePayload
  | DeleteRolePayload
  | ManageRolePermissionsPayload;

@Injectable()
export class RolePolicy implements AuthorizationPolicy<RoleAction> {
  constructor(
    private readonly caslFactory: CaslAbilityBuilder<Principal>,
    @Inject(ROLE_QUERY_REPOSITORY_TOKEN)
    private readonly roleQueryRepository: IRoleQueryRepository,
  ) {}

  async authorize(
    action: RoleAction,
    context: AuthorizationContext<Principal>,
    payload?: RolePayload,
  ): Promise<void> {
    switch (action) {
      case RoleAction.Create:
        return this.authorizeCreate(context);
      case RoleAction.View:
        return this.authorizeView(context, payload as ViewRolePayload);
      case RoleAction.Update:
      case RoleAction.Delete:
      case RoleAction.ManagePermissions:
        return this.authorizeForExistingRole(
          action,
          context,
          payload as { roleId?: string },
        );
    }
  }

  /**
   * الدور لم يُنشأ بعد، فنفحص على كيان افتراضي يحمل الـ tenant الذي
   * سيُنشأ فيه — وإلا تجاوزنا شرط { tenantId } في RoleAbility.
   */
  private authorizeCreate(context: AuthorizationContext<Principal>): void {
    const ability = this.caslFactory.create(context.principal);
    const candidate =
      context.principal.subject.type === SubjectType.PLATFORM_ADMIN
        ? RoleSubject
        : subject(RoleSubject, {
            tenantId: context.principal.tenantId,
          } as never);

    if (!ability.can(RoleAction.Create, candidate)) {
      throw new AccessDeniedException();
    }
  }

  /**
   * القوائم لا تحمل معرّفاً: يُفحص النوع مجرداً ثم يقصر الـ scope الصفوف.
   * الصلاحية قبل الوجود: لا نكشف وجود دور في tenant آخر عبر 404.
   */
  private async authorizeView(
    context: AuthorizationContext<Principal>,
    payload?: ViewRolePayload,
  ): Promise<void> {
    const ability = this.caslFactory.create(context.principal);

    if (!payload?.roleId) {
      if (!ability.can(RoleAction.View, RoleSubject)) {
        throw new AccessDeniedException();
      }
      return;
    }

    const entity = await this.roleQueryRepository.findById(payload.roleId);

    if (
      !ability.can(
        RoleAction.View,
        entity ? subject(RoleSubject, entity) : (RoleSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }

  private async authorizeForExistingRole(
    action: RoleAction,
    context: AuthorizationContext<Principal>,
    payload?: { roleId?: string },
  ): Promise<void> {
    if (!payload?.roleId) {
      throw new BadRequestException('Role ID is required for authorization');
    }

    const ability = this.caslFactory.create(context.principal);
    const entity = await this.roleQueryRepository.findById(payload.roleId);

    if (
      !ability.can(
        action,
        entity ? subject(RoleSubject, entity) : (RoleSubject as never),
      )
    ) {
      throw new AccessDeniedException();
    }
  }
}
