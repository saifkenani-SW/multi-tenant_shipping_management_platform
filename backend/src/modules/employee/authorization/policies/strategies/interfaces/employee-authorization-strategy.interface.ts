import { AuthorizationContext } from '../../../../../../packages/authorization';
import { EmployeeAction } from '../../../actions/employee.action';

export interface EmployeeAuthorizationStrategy<TPayload = unknown> {
  readonly action: EmployeeAction;

  authorize(context: AuthorizationContext, payload?: TPayload): Promise<void>;
}
