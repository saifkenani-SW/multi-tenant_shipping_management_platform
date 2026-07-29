import { AuthorizationContext } from '../../../../../../packages/authorization';
import { GlobalLocationAction } from '../../../actions/global-location.action';

export interface GlobalLocationAuthorizationStrategy<TPayload = unknown> {
  readonly action: GlobalLocationAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
