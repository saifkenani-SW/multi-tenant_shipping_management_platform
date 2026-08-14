import { Injectable } from '@nestjs/common';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../../../packages/authorization';
import { ContextAuthorizationProvider } from '../../../../../../packages/authorization/providers/context-authorization.provider';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';
import { PodScopeInterface } from './pod-scope.interface';

@Injectable()
export class PodVisibilityScope implements VisibilityScopeBuilder<PodScopeInterface> {
  constructor(private readonly context: ContextAuthorizationProvider) {}

  buildScope(): PodScopeInterface {
    const principal = this.context.getContext().principal;
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      return { pod: {}, shipment: {} };
    }

    if (type === SubjectType.CUSTOMER) {
      return {
        pod: {},
        shipment: { 
          sender_phone: principal.phone,
          receiver_phone: principal.phone 
        },
      };
    }

    if (type === SubjectType.TENANT_ADMIN || type === SubjectType.EMPLOYEE) {
      return {
        pod: { tenant_id: principal.tenantId },
        shipment: {},
      };
    }

    throw new AccessDeniedException(
      `Subject type ${type} is not supported for ProofOfDelivery visibility scope.`,
    );
  }
}
