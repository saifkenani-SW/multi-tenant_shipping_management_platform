import { Injectable } from '@nestjs/common';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../../../packages/authorization';
import { ContextAuthorizationProvider } from '../../../../../../packages/authorization/providers/context-authorization.provider';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';
import { TripScopeInterface } from './trip-scope.interface';

@Injectable()
export class TripVisibilityScope implements VisibilityScopeBuilder<TripScopeInterface> {
  constructor(private readonly context: ContextAuthorizationProvider) {}

  buildScope(): TripScopeInterface {
    const principal = this.context.getContext().principal;
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      return {};
    }

    if (type === SubjectType.TENANT_ADMIN) {
      return { tenantId: principal.tenantId };
    }

    if (type === SubjectType.DRIVER) {
      return {
        tenantId: principal.tenantId,
        driverId: principal.profileId,
      };
    }

    if (type === SubjectType.EMPLOYEE) {
      const orgUnitIds = [
        ...(principal.branches || []).map((b) => b.id),
        ...(principal.warehouses || []).map((w) => w.id),
      ];

      return {
        tenantId: principal.tenantId,
        orgUnitIds,
      };
    }

    throw new AccessDeniedException(
      `Subject type ${type} is not supported for Trip visibility scope.`,
    );
  }
}
