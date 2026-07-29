import { AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { ApplicationAbility } from '../../../../authorization/application-ability';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { RoleAction } from '../actions/role.action';
import { RoleSubject } from '../subjects/role.subject';

/**
 * TODO: راجع هذه القواعد.
 *
 * الافتراض:
 * - العميل لا يملك أدواراً إطلاقاً.
 * - مدير المنصة يدير أدوار أي tenant (للدعم الفني).
 * - مدير الـ tenant يدير أدوار شركته فقط، والشرط { tenantId } هو ما
 *   يمنع تسرب دور من شركة إلى أخرى.
 * - الموظف العادي يقرأ أدوار شركته فقط (لعرض من يملك ماذا) ولا يعدّلها.
 *
 * ManagePermissions مفصولة عن Update عمداً: تعديل اسم دور أخف بكثير
 * من منحه صلاحية جديدة.
 */
@CaslContributor()
@Injectable()
export class RoleAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    if (principal.subject.type === SubjectType.CUSTOMER) {
      return;
    }

    if (principal.subject.type === SubjectType.PLATFORM_ADMIN) {
      builder.can(RoleAction.View, RoleSubject);
      builder.can(RoleAction.Create, RoleSubject);
      builder.can(RoleAction.Update, RoleSubject);
      builder.can(RoleAction.Delete, RoleSubject);
      builder.can(RoleAction.ManagePermissions, RoleSubject);
      return;
    }

    if (!principal.tenantId) {
      return;
    }

    const ownTenant = { tenantId: principal.tenantId } as never;

    builder.can(RoleAction.View, RoleSubject, ownTenant);

    if (principal.subject.type === SubjectType.TENANT_ADMIN) {
      builder.can(RoleAction.Create, RoleSubject, ownTenant);
      builder.can(RoleAction.Update, RoleSubject, ownTenant);
      builder.can(RoleAction.Delete, RoleSubject, ownTenant);
      builder.can(RoleAction.ManagePermissions, RoleSubject, ownTenant);
    }
  }
}
