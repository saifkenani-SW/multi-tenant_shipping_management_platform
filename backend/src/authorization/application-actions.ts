import { TenantAction } from '../modules/tenant/domain/authorization/actions/tenant.action';
import { EmployeeAction } from '../modules/employee/authorization';
import { ShipmentAction } from '../modules/customer-shipment/shipment/domain/authorization/actions/shipment.action';
import { ParcelAction } from '../modules/customer-shipment/parcel/domain/authorization/actions/parcel.action';

export type ApplicationActions =
  | TenantAction
  | EmployeeAction
  | ShipmentAction
  | ParcelAction;
