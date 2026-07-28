import { PermissionAction } from '../modules/permission/authorization';
import { TenantAction } from '../modules/tenant/authorization';

export type ApplicationActions = TenantAction | PermissionAction;
