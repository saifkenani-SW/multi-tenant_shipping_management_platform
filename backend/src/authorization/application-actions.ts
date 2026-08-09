import { TenantAction } from '../modules/tenant/domain/authorization';
import { PermissionAction } from '../modules/authorization';
import { EmployeeAction } from '../modules/employee/authorization';
import { ShipmentAction } from '../modules/customer-shipment/shipment/domain/authorization/actions/shipment.action';
import { ParcelAction } from '../modules/customer-shipment/parcel/domain/authorization/actions/parcel.action';
import { PodAction } from '../modules/customer-shipment/proof-of-delivery/domain/authorization/actions/pod.action';

export type ApplicationActions =
  | TenantAction
  | PermissionAction
  | EmployeeAction
  | ShipmentAction
  | ParcelAction
  | PodAction;
