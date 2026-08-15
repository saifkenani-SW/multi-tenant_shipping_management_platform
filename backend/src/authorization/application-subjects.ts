import { TenantSubject } from '../modules/tenant/domain/authorization/subjects/tenant.subject';
import { EmployeeSubject } from '../modules/employee/authorization';
import { ShipmentSubject } from '../modules/customer-shipment/shipment/domain/authorization/subjects/shipment.subject';
import { ParcelSubject } from '../modules/customer-shipment/parcel/domain/authorization/subjects/parcel.subject';
import { TripSubject } from '../modules/fleet/trip/domain/authorization/subjects/trip.subject';
import { ManifestSubject } from '../modules/fleet/transport_manifest/domain/authorization/subjects/manifest.subject';

export type ApplicationSubjects =
  | typeof TenantSubject
  | typeof EmployeeSubject
  | typeof ShipmentSubject
  | typeof ParcelSubject
  | typeof TripSubject
  | typeof ManifestSubject;
