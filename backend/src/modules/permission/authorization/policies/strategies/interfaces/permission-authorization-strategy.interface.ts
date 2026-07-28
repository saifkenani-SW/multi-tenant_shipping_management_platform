import { AuthorizationContext } from '../../../../../../packages/authorization';
import { PermissionAction } from '../../../actions/permission.action';

export interface PermissionAuthorizationStrategy<TPayload = unknown> {
  readonly action: PermissionAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
