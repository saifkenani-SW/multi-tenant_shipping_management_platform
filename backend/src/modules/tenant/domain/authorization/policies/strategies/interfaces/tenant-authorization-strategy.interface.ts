import { TenantAction } from '../../../actions/tenant.action';
import { AuthorizationContext } from '../../../../../../../packages/authorization';

export interface TenantAuthorizationStrategy<TPayload = unknown> {
  readonly action: TenantAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
