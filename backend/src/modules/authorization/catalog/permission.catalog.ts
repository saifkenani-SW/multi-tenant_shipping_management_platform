import { Permission } from '../../../core/security/Permission';

export interface PermissionCatalogEntry {
  readonly name: Permission;
  readonly resource: string;
  readonly action: string;
  readonly description: string;
}

export const PERMISSION_CATALOG: Record<Permission, PermissionCatalogEntry> = {
  [Permission.CREATE_PARCEL]: {
    name: Permission.CREATE_PARCEL,
    resource: 'parcel',
    action: 'create',
    description: 'Create parcels',
  },
  [Permission.READ_PARCEL]: {
    name: Permission.READ_PARCEL,
    resource: 'parcel',
    action: 'read',
    description: 'View parcels',
  },
  [Permission.UPDATE_PARCEL]: {
    name: Permission.UPDATE_PARCEL,
    resource: 'parcel',
    action: 'update',
    description: 'Update parcels',
  },
  [Permission.DELETE_PARCEL]: {
    name: Permission.DELETE_PARCEL,
    resource: 'parcel',
    action: 'delete',
    description: 'Delete parcels',
  },
  [Permission.CANCEL_PARCEL]: {
    name: Permission.CANCEL_PARCEL,
    resource: 'parcel',
    action: 'cancel',
    description: 'Cancel parcels',
  },
  [Permission.RECEIVE_PARCEL]: {
    name: Permission.RECEIVE_PARCEL,
    resource: 'parcel',
    action: 'receive',
    description: 'Receive parcels at branch',
  },
  [Permission.DISPATCH_PARCEL]: {
    name: Permission.DISPATCH_PARCEL,
    resource: 'parcel',
    action: 'dispatch',
    description: 'Dispatch parcels from branch',
  },
  [Permission.COLLECT_PARCEL]: {
    name: Permission.COLLECT_PARCEL,
    resource: 'parcel',
    action: 'collect',
    description: 'Hand over parcels to customers',
  },
  [Permission.CREATE_SHIPMENT]: {
    name: Permission.CREATE_SHIPMENT,
    resource: 'shipment',
    action: 'create',
    description: 'Create shipments',
  },
  [Permission.READ_SHIPMENT]: {
    name: Permission.READ_SHIPMENT,
    resource: 'shipment',
    action: 'read',
    description: 'View shipments',
  },
  [Permission.UPDATE_SHIPMENT]: {
    name: Permission.UPDATE_SHIPMENT,
    resource: 'shipment',
    action: 'update',
    description: 'Update shipments',
  },
  [Permission.DELETE_SHIPMENT]: {
    name: Permission.DELETE_SHIPMENT,
    resource: 'shipment',
    action: 'delete',
    description: 'Delete shipments',
  },
  [Permission.CANCEL_SHIPMENT]: {
    name: Permission.CANCEL_SHIPMENT,
    resource: 'shipment',
    action: 'cancel',
    description: 'Cancel shipments',
  },
  [Permission.RETURN_SHIPMENT]: {
    name: Permission.RETURN_SHIPMENT,
    resource: 'shipment',
    action: 'return',
    description: 'Return shipments',
  },
  [Permission.READ_SHIPMENT_REQUEST]: {
    name: Permission.READ_SHIPMENT_REQUEST,
    resource: 'shipment_request',
    action: 'read',
    description: 'View shipment requests',
  },
  [Permission.MANAGE_SHIPMENT_REQUEST]: {
    name: Permission.MANAGE_SHIPMENT_REQUEST,
    resource: 'shipment_request',
    action: 'manage',
    description: 'Create, update and resolve shipment requests',
  },
  [Permission.MANAGE_USERS]: {
    name: Permission.MANAGE_USERS,
    resource: 'employee',
    action: 'manage',
    description: 'Manage employees and their assignments',
  },
  [Permission.MANAGE_ROLES]: {
    name: Permission.MANAGE_ROLES,
    resource: 'role',
    action: 'manage',
    description: 'Manage roles and their permissions',
  },
  [Permission.VIEW_REPORTS]: {
    name: Permission.VIEW_REPORTS,
    resource: 'report',
    action: 'read',
    description: 'View operational reports',
  },
  [Permission.MANAGE_BILLING]: {
    name: Permission.MANAGE_BILLING,
    resource: 'billing',
    action: 'manage',
    description: 'Manage invoices and payments',
  },

  // Fleet — Manifests
  [Permission.CREATE_MANIFEST]: {
    name: Permission.CREATE_MANIFEST,
    resource: 'manifest',
    action: 'create',
    description: 'Create transport manifests',
  },
  [Permission.READ_MANIFEST]: {
    name: Permission.READ_MANIFEST,
    resource: 'manifest',
    action: 'read',
    description: 'View transport manifests',
  },
  [Permission.UPDATE_MANIFEST]: {
    name: Permission.UPDATE_MANIFEST,
    resource: 'manifest',
    action: 'update',
    description: 'Add items, finalize or reopen manifests',
  },

  // Fleet — Trips
  [Permission.CREATE_TRIP]: {
    name: Permission.CREATE_TRIP,
    resource: 'trip',
    action: 'create',
    description: 'Create trips',
  },
  [Permission.READ_TRIP]: {
    name: Permission.READ_TRIP,
    resource: 'trip',
    action: 'read',
    description: 'View trips',
  },
  [Permission.UPDATE_TRIP]: {
    name: Permission.UPDATE_TRIP,
    resource: 'trip',
    action: 'update',
    description: 'Update, start, complete or cancel trips',
  },

  // Fleet — Vehicles
  [Permission.CREATE_VEHICLE]: {
    name: Permission.CREATE_VEHICLE,
    resource: 'vehicle',
    action: 'create',
    description: 'Register vehicles',
  },
  [Permission.READ_VEHICLE]: {
    name: Permission.READ_VEHICLE,
    resource: 'vehicle',
    action: 'read',
    description: 'View vehicles and their assignments',
  },
  [Permission.UPDATE_VEHICLE]: {
    name: Permission.UPDATE_VEHICLE,
    resource: 'vehicle',
    action: 'update',
    description: 'Update vehicle details and driver assignments',
  },
  [Permission.DELETE_VEHICLE]: {
    name: Permission.DELETE_VEHICLE,
    resource: 'vehicle',
    action: 'delete',
    description: 'Release vehicle driver assignments',
  },
};

export const PERMISSION_CATALOG_ENTRIES: readonly PermissionCatalogEntry[] =
  Object.freeze(Object.values(PERMISSION_CATALOG));
