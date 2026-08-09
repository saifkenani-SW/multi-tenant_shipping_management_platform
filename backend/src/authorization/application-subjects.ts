import { EmployeeSubject } from '../modules/employee/authorization/subjects/employee.subject';
import { TenantSubject } from '../modules/tenant/domain/authorization/subjects/tenant.subject';
import { ShipmentSubject } from '../modules/customer-shipment/shipment/domain/authorization/subjects/shipment.subject';
import { ParcelSubject } from '../modules/customer-shipment/parcel/domain/authorization/subjects/parcel.subject';
import { PodSubject } from '../modules/customer-shipment/proof-of-delivery/domain/authorization/subjects/pod.subject';

export type ApplicationSubjects =
  | typeof TenantSubject
  | typeof EmployeeSubject
  | typeof ShipmentSubject
  | typeof ParcelSubject
  | typeof PodSubject;
