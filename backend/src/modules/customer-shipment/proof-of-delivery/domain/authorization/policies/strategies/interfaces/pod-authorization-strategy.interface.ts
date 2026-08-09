import { PodAction } from '../../../actions/pod.action';
import { AuthorizationContext } from '../../../../../../../../packages/authorization';

export interface PodAuthorizationStrategy<TPayload = unknown> {
  readonly action: PodAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
