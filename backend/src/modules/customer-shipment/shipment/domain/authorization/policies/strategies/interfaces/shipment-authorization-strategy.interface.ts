import { ShipmentAction } from '../../../actions/shipment.action';
import { AuthorizationContext } from '../../../../../../../../packages/authorization';

export interface ShipmentAuthorizationStrategy<TPayload = unknown> {
  readonly action: ShipmentAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
