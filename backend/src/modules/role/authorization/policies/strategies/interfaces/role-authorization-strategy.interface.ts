import { AuthorizationContext } from '../../../../../../packages/authorization';
import { RoleAction } from '../../../actions/role.action';

export interface RoleAuthorizationStrategy<TPayload = unknown> {
  readonly action: RoleAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
