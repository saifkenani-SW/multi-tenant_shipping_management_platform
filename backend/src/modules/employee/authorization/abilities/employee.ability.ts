import { AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { ApplicationAbility } from '../../../../authorization/application-ability';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { EmployeeAction } from '../actions/employee.action';
import { EmployeeSubject } from '../subjects/employee.subject';

/**
 * TODO: راجع هذه القواعد — هذا أخطر ملف في المجموعة.
 *
 * الافتراض:
 * - العميل لا يرى موظفي الشركات.
 * - مدير المنصة يدير موظفي أي شركة (دعم فني).
 * - مدير الشركة يدير موظفي شركته، والشرط { tenantId } هو ما يمنع
 *   تسرّب موظف من شركة إلى أخرى.
 * - الموظف العادي يقرأ زملاءه ولا يعدّل شيئاً.
 *
 * ManageAssignments هي الفعل الحسّاس: من يملكها يستطيع منح أي دور لأي
 * موظف، أي أنه يستطيع ترقية نفسه إن كان له تعيين. راجع بعناية.
 */
@CaslContributor()
@Injectable()
export class EmployeeAbility implements CaslAbilityContributor<
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
      builder.can(EmployeeAction.View, EmployeeSubject);
      builder.can(EmployeeAction.Create, EmployeeSubject);
      builder.can(EmployeeAction.Update, EmployeeSubject);
      builder.can(EmployeeAction.ChangeStatus, EmployeeSubject);
      builder.can(EmployeeAction.ManageAssignments, EmployeeSubject);
      return;
    }

    if (!principal.tenantId) {
      return;
    }

    const ownTenant = { tenantId: principal.tenantId } as never;

    builder.can(EmployeeAction.View, EmployeeSubject, ownTenant);

    if (principal.subject.type === SubjectType.TENANT_ADMIN) {
      builder.can(EmployeeAction.Create, EmployeeSubject, ownTenant);
      builder.can(EmployeeAction.Update, EmployeeSubject, ownTenant);
      builder.can(EmployeeAction.ChangeStatus, EmployeeSubject, ownTenant);
      builder.can(EmployeeAction.ManageAssignments, EmployeeSubject, ownTenant);
    }
  }
}
