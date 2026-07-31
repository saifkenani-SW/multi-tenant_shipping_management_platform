import { Injectable } from '@nestjs/common';

import type { AuthorizationContext } from '../../../../packages/authorization';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../packages/authorization';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import type { EmployeeScopeInterface } from './employee-scope.interface';

/**
 * TODO: راجع هذه القواعد.
 *
 * الافتراض: مدير المنصة يرى كل الموظفين، وغيره محصور بموظفي شركته.
 *
 * ملاحظة متروكة لك: بيانات الموظفين أكثر حساسية من الفروع (رقم وطني،
 * بريد). لو أردت أن يرى الموظف العادي زملاء فرعه فقط بدل كل الشركة،
 * فالمكان هنا — يحتاج حقلاً إضافياً مثل `organizationUnitIds` من
 * principal.branches وتصفية مقابلة في المستودع.
 */
@Injectable()
export class EmployeeVisibilityScope implements VisibilityScopeBuilder<EmployeeScopeInterface> {
  buildScope(context: AuthorizationContext<Principal>): EmployeeScopeInterface {
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
