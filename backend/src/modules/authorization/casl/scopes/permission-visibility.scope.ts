import { Injectable } from '@nestjs/common';

import type { AuthorizationContext } from '../../../../packages/authorization';
import { VisibilityScopeBuilder } from '../../../../packages/authorization';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import type { PermissionScopeInterface } from './permission-scope.interface';

/**
 * TODO: راجع هذه القواعد.
 *
 * كتالوج عام: من اجتاز فحص التفويض يرى كل الصفوف، فلا قيود صفوف.
 * تقييد "من يقرأ أصلاً" مسؤولية PermissionAbility لا هذا الـ scope.
 */
@Injectable()
export class PermissionVisibilityScope implements VisibilityScopeBuilder<PermissionScopeInterface> {
  buildScope(
    _context: AuthorizationContext<Principal>,
  ): PermissionScopeInterface {
    return {};
  }
}
