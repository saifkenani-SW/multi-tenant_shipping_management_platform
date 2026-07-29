import { AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { ApplicationAbility } from '../../../../authorization/application-ability';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { OrganizationUnitAction } from '../actions/organization-unit.action';
import { OrganizationUnitSubject } from '../subjects/organization-unit.subject';

/**
 * TODO: راجع هذه القواعد.
 *
 * الافتراض:
 * - العميل لا يرى هيكل الشركة الداخلي.
 * - مدير المنصة يدير وحدات أي شركة (دعم فني).
 * - مدير الشركة يدير وحدات شركته، والشرط { tenantId } هو ما يمنع
 *   تسرّب وحدة من شركة إلى أخرى.
 * - الموظف يقرأ وحدات شركته ولا يعدّلها.
 *
 * ManageCoverage مفصولة عن Update لأن التغطية تحدد توجيه الشحنات:
 * تعديلها يغيّر أي فرع يستقبل أي طرد.
 */
@CaslContributor()
@Injectable()
export class OrganizationUnitAbility implements CaslAbilityContributor<
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
      builder.can(OrganizationUnitAction.View, OrganizationUnitSubject);
      builder.can(OrganizationUnitAction.Create, OrganizationUnitSubject);
      builder.can(OrganizationUnitAction.Update, OrganizationUnitSubject);
      builder.can(OrganizationUnitAction.Delete, OrganizationUnitSubject);
      builder.can(
        OrganizationUnitAction.ManageCoverage,
        OrganizationUnitSubject,
      );
      return;
    }

    if (!principal.tenantId) {
      return;
    }

    const ownTenant = { tenantId: principal.tenantId } as never;

    builder.can(OrganizationUnitAction.View, OrganizationUnitSubject, ownTenant);

    if (principal.subject.type === SubjectType.TENANT_ADMIN) {
      builder.can(
        OrganizationUnitAction.Create,
        OrganizationUnitSubject,
        ownTenant,
      );
      builder.can(
        OrganizationUnitAction.Update,
        OrganizationUnitSubject,
        ownTenant,
      );
      builder.can(
        OrganizationUnitAction.Delete,
        OrganizationUnitSubject,
        ownTenant,
      );
      builder.can(
        OrganizationUnitAction.ManageCoverage,
        OrganizationUnitSubject,
        ownTenant,
      );
    }
  }
}
