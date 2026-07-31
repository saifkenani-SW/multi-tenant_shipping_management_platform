import { AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { ApplicationAbility } from '../../../../authorization/application-ability';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { PermissionAction } from '../actions/permission.action';
import { PermissionSubject } from '../subjects/permission.subject';

/**
 * TODO: راجع هذه القواعد.
 *
 * الافتراض: الكتالوج مرجع عام غير حساس ولا يحمل بيانات أي tenant،
 * وكل مستخدم داخل المنصة يحتاج قراءته لبناء شاشات إدارة الأدوار.
 * لذلك القراءة متاحة لكل من ليس عميلاً.
 *
 * العميل (CUSTOMER) مستثنى لأنه لا يملك أدواراً أصلاً.
 */
@CaslContributor()
@Injectable()
export class PermissionAbility implements CaslAbilityContributor<
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

    builder.can(PermissionAction.View, PermissionSubject);
  }
}
