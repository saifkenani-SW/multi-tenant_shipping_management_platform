import { Injectable } from '@nestjs/common';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../../../packages/authorization';
import { ContextAuthorizationProvider } from '../../../../../../packages/authorization/providers/context-authorization.provider';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';
import { ParcelScopeInterface } from './parcel-scope.interface';

/**
 * Rows each subject type may see. Mandatory: a caller filter may narrow these
 * further but never widen them.
 */
@Injectable()
export class ParcelVisibilityScope implements VisibilityScopeBuilder<ParcelScopeInterface> {
  constructor(private readonly context: ContextAuthorizationProvider) {}

  buildScope(): ParcelScopeInterface {
    const principal = this.context.getContext().principal;
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      return { parcel: {}, shipment: {} };
    }

    if (type === SubjectType.CUSTOMER) {
      return {
        parcel: {},
        shipment: { sender_customer_profile_id: principal.profileId },
      };
    }

    if (
      type === SubjectType.TENANT_ADMIN ||
      type === SubjectType.EMPLOYEE ||
      type === SubjectType.DRIVER
    ) {
      return {
        parcel: { tenant_id: principal.tenantId },
        shipment: {},
      };
    }

    throw new AccessDeniedException(
      `Subject type ${type} is not supported for Parcel visibility scope.`,
    );
  }
}
