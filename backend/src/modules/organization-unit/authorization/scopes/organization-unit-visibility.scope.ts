import { Injectable } from '@nestjs/common';

import type { AuthorizationContext } from '../../../../packages/authorization';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../packages/authorization';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import type { OrganizationUnitScopeInterface } from './organization-unit-scope.interface';

/**
 * TODO: راجع هذه القواعد.
 *
 * الافتراض: مدير المنصة يرى كل الوحدات، وغيره محصور بوحدات شركته.
 *
 * ملاحظة متروكة لك: Principal يحمل `branches` و `warehouses` (نطاقات
 * الموظف الفعلية). لو أردت أن يرى الموظف العادي فروعه المسنَدة فقط بدل
 * كل فروع الشركة، فهذا هو الموضع — يحتاج حقل إضافي في الـ scope مثل
 * `unitIds` وتصفية مقابلة في المستودع.
 */
@Injectable()
export class OrganizationUnitVisibilityScope implements VisibilityScopeBuilder<OrganizationUnitScopeInterface> {
  buildScope(
    context: AuthorizationContext<Principal>,
  ): OrganizationUnitScopeInterface {
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
