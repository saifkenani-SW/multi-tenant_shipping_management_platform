import { CreateTenantDto } from '../dtos/requests/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/requests/update-tenant.dto';
import { AssignSubscriptionDto } from '../dtos/requests/assign-subscription.dto';
import {
  CancelSubscriptionDto,
  ReasonDto,
  SuspendSubscriptionDto,
} from '../dtos/requests/subscription-action.dto';

export interface ITenantCommandService {
  createTenant(dto: CreateTenantDto): Promise<string>;
  updateTenant(id: string, dto: UpdateTenantDto): Promise<void>;
  suspendTenant(id: string, reason?: string): Promise<void>;
  activateTenant(id: string): Promise<void>;

  assignSubscription(
    tenantId: string,
    dto: AssignSubscriptionDto,
    performedBy: string,
  ): Promise<void>;
  /*  renewSubscription(
    tenantId: string,
    dto: RenewSubscriptionDto,
    performedBy: string,
  ): Promise<void>;*/
  suspendSubscription(
    tenantId: string,
    dto: SuspendSubscriptionDto,
    performedBy: string,
  ): Promise<void>;
  resumeSubscription(
    tenantId: string,
    dto: ReasonDto,
    performedBy: string,
  ): Promise<void>;
  cancelSubscription(
    tenantId: string,
    dto: CancelSubscriptionDto,
    performedBy: string,
  ): Promise<void>;
}
