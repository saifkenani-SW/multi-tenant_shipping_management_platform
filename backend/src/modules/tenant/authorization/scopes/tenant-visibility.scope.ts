import type { AuthorizationContext } from '../../../../packages/authorization';
import {
  AccessDeniedException,
  VisibilityScopeBuilder,
} from '../../../../packages/authorization';
import { Injectable } from '@nestjs/common';
import type { TenantScopeInterface } from './tenant-scope.interface';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';

@Injectable()
export class TenantVisibilityScope implements VisibilityScopeBuilder<TenantScopeInterface> {
  buildScope(context: AuthorizationContext<Principal>): TenantScopeInterface {
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
