import { AuthorizationContext } from '../../../../../../packages/authorization';
import { OrganizationUnitAction } from '../../../actions/organization-unit.action';

export interface OrganizationUnitAuthorizationStrategy<TPayload = unknown> {
  readonly action: OrganizationUnitAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
