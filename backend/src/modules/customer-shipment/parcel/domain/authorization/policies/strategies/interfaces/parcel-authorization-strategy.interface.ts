import { ParcelAction } from '../../../actions/parcel.action';
import { AuthorizationContext } from '../../../../../../../../packages/authorization';

export interface ParcelAuthorizationStrategy<TPayload = unknown> {
  readonly action: ParcelAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
