import { subject } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import {
  AuthorizationContext,
  CapabilityBuilder,
} from '../../../../packages/authorization';
import { CaslAbilityBuilder } from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { OrganizationUnit } from '../../domain/organization-unit.entity';
import { OrganizationUnitAction } from '../actions/organization-unit.action';
import { OrganizationUnitSubject } from '../subjects/organization-unit.subject';
import { OrganizationUnitCapabilities } from './organization-unit.capabilities.interface';

@Injectable()
export class OrganizationUnitCapabilityBuilder implements CapabilityBuilder<
  OrganizationUnit,
  OrganizationUnitCapabilities
> {
  constructor(private readonly abilityFactory: CaslAbilityBuilder<Principal>) {}

  buildCapabilities(
    entity: OrganizationUnit,
    context: AuthorizationContext<Principal>,
  ): OrganizationUnitCapabilities {
    const ability = this.abilityFactory.create(context.principal);
    const unitSubject = subject(OrganizationUnitSubject, entity);

    return {
      canUpdate: ability.can(OrganizationUnitAction.Update, unitSubject),
      canDelete: ability.can(OrganizationUnitAction.Delete, unitSubject),
      canManageCoverage: ability.can(
        OrganizationUnitAction.ManageCoverage,
        unitSubject,
      ),
    };
  }
}
