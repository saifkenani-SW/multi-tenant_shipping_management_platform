import { Injectable } from '@nestjs/common';

import type { AuthorizationContext } from '../../../../packages/authorization';
import { VisibilityScopeBuilder } from '../../../../packages/authorization';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import type { GlobalLocationScopeInterface } from './global-location-scope.interface';

/**
 * TODO: راجع هذه القواعد.
 *
 * مرجع عام: من اجتاز فحص التفويض يرى كل الصفوف.
 */
@Injectable()
export class GlobalLocationVisibilityScope implements VisibilityScopeBuilder<GlobalLocationScopeInterface> {
  buildScope(
    _context: AuthorizationContext<Principal>,
  ): GlobalLocationScopeInterface {
    return {};
  }
}
