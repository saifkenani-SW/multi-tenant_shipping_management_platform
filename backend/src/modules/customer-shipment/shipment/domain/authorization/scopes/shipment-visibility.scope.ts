import { Injectable } from '@nestjs/common';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../../../packages/authorization';
import { ContextAuthorizationProvider } from '../../../../../../packages/authorization/providers/context-authorization.provider';
import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';
import { ShipmentScopeInterface } from './shipment-scope.interface';

/**
 * Rows each subject type is allowed to see.
 *
 * The returned constraints are mandatory: a caller-supplied filter may narrow
 * them further but never widen them. The query service enforces that.
 */
@Injectable()
export class ShipmentVisibilityScope implements VisibilityScopeBuilder<ShipmentScopeInterface> {
  constructor(private readonly context: ContextAuthorizationProvider) {}

  buildScope(): ShipmentScopeInterface {
    const context = this.context.getContext();
    const principal = context.principal;
    const type = principal.subject.type;

    if (type === SubjectType.PLATFORM_OWNER) {
      return { shipment: {}, parcel: {} };
    }

    if (type === SubjectType.CUSTOMER) {
      return {
        shipment: { sender_customer_profile_id: principal.profileId },
        parcel: {},
      };
    }

    if (type === SubjectType.TENANT_ADMIN) {
      return {
        shipment: { tenant_id: principal.tenantId },
        parcel: { tenant_id: principal.tenantId },
      };
    }

    if (type === SubjectType.EMPLOYEE) {
      const orgUnitIds = [
        ...(principal.branches?.map((b) => b.id) || []),
        ...(principal.warehouses?.map((w) => w.id) || []),
      ];

      return {
        shipment: {
          tenant_id: principal.tenantId,
          origin_org_unit_ids: orgUnitIds,
        },
        parcel: { tenant_id: principal.tenantId },
      };
    }

    throw new AccessDeniedException(
      `Subject type ${type} is not supported for CustomerShipment visibility scope.`,
    );
  }
}
