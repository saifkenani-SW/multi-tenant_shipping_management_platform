import { Injectable } from '@nestjs/common';

import type { AuthorizationContext } from '../../../../packages/authorization';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../packages/authorization';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import type { RoleScopeInterface } from './role-scope.interface';

/**
 * TODO: راجع هذه القواعد.
 *
 * نفس منطق TenantVisibilityScope: مدير المنصة يرى كل الأدوار، وغيره
 * محصور بأدوار الـ tenant التابع له. من لا يحمل tenantId ولا يملك
 * صلاحية المنصة لا يُسمح له بقائمة مفتوحة.
 */
@Injectable()
export class RoleVisibilityScope implements VisibilityScopeBuilder<RoleScopeInterface> {
  buildScope(context: AuthorizationContext<Principal>): RoleScopeInterface {
    if (context.principal.subject.type === SubjectType.PLATFORM_ADMIN) {
      return {};
    }

    if (!context.principal.tenantId) {
      throw new AccessDeniedException();
    }

    return {
      tenantId: context.principal.tenantId,
    };
  }
}
