export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
}

export enum PermissionResource {
  TENANT = 'TENANT',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
  SHIPMENT = 'SHIPMENT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  TRIP = 'TRIP',
  VEHICLE = 'VEHICLE',
  MANIFEST = 'MANIFEST',
}

export enum PermissionSearchField {
  NAME = 'name',
  RESOURCE = 'resource',
}
