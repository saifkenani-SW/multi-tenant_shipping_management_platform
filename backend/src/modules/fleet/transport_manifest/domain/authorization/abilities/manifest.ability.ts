import { Injectable } from '@nestjs/common';
import { AbilityBuilder } from '@casl/ability';
import { ManifestAction } from '../actions/manifest.action';
import { ManifestSubject } from '../subjects/manifest.subject';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../../../packages/authorization-casl';
import { ApplicationAbility } from '../../../../../../authorization/application-ability';
import { Principal } from '../../../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';

@CaslContributor()
@Injectable()
export class ManifestAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      builder.can(ManifestAction.View, ManifestSubject);
      return;
    }

    if (!principal.tenantId) return;

    const ownTenant = { tenantId: principal.tenantId } as any;

    if (type === SubjectType.TENANT_ADMIN) {
      builder.can(ManifestAction.View, ManifestSubject, ownTenant);
      builder.can(ManifestAction.Update, ManifestSubject, ownTenant);
      return;
    }

    if (type === SubjectType.DRIVER) {
      builder.can(ManifestAction.View, ManifestSubject, {
        tenantId: principal.tenantId,
        tripDriverId: principal.profileId,
      } as any);
      return;
    }

    if (type === SubjectType.EMPLOYEE) {
      const orgUnits = [
        ...(principal.branches || []),
        ...(principal.warehouses || []),
      ];
      for (const orgUnit of orgUnits) {
        builder.can(ManifestAction.View, ManifestSubject, {
          tenantId: principal.tenantId,
          originOrgUnitId: orgUnit.id,
        } as any);
        builder.can(ManifestAction.Update, ManifestSubject, {
          tenantId: principal.tenantId,
          originOrgUnitId: orgUnit.id,
        } as any);
        builder.can(ManifestAction.View, ManifestSubject, {
          tenantId: principal.tenantId,
          destinationOrgUnitId: orgUnit.id,
        } as any);
      }
      return;
    }
  }
}
