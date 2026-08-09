import { Injectable } from '@nestjs/common';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../packages/authorization';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { ShipmentRequestScopeInterface } from './shipment-request-scope.interface';
import { ContextAuthorizationProvider } from '../../../../packages/authorization/providers/context-authorization.provider';

@Injectable()
export class ShipmentRequestVisibilityScope implements VisibilityScopeBuilder<ShipmentRequestScopeInterface> {
  constructor(private readonly context: ContextAuthorizationProvider) {}
  buildScope(): ShipmentRequestScopeInterface {
    const context = this.context.getContext();
    const principal = context.principal;
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      return { request: {}, quotation: {} };
    }

    if (type === SubjectType.TENANT_ADMIN) {
      return {
        request: { target_tenant_id: principal.tenantId },
        quotation: { tenant_id: principal.tenantId },
      };
    }

    if (principal.subject.type === SubjectType.CUSTOMER) {
      return {
        request: { customer_profile_id: principal.profileId },
        quotation: {},
      };
    }

    if (type === SubjectType.EMPLOYEE) {
      const orgUnitIds = [
        ...(context.principal.branches?.map((b) => b.id) || []),
        ...(context.principal.warehouses?.map((w) => w.id) || []),
      ];
      return {
        request: { target_tenant_id: principal.tenantId },
        quotation: { origin_org_unit_ids: orgUnitIds },
      };
    }

    throw new AccessDeniedException(
      `Subject type ${type} is not supported for ShipmentRequest visibility scope.`,
    );
  }
}
