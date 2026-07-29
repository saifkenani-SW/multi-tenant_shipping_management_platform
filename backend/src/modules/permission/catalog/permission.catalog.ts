import { Permission } from '../../../core/security/Permission';

export interface PermissionCatalogEntry {
  readonly name: Permission;
  readonly resource: string;
  readonly action: string;
  readonly description: string;
}

/**
 * المصدر الوحيد لحقيقة الصلاحيات.
 *
 * الصلاحية سطر في قاعدة البيانات فقط لتتمكن الأدوار من الإشارة إليها،
 * أما تعريفها فيبقى في الكود لأن كل صلاحية يقابلها فحص فعلي. لذلك لا
 * توجد نقاط نهاية لإنشائها أو تعديلها — التغيير يمر عبر نشر جديد ثم
 * PermissionSeeder.
 *
 * Record يضمن أن أي عضو جديد في enum Permission يكسر الترجمة حتى
 * يُوصَّف هنا.
 */
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
};

export const PERMISSION_CATALOG_ENTRIES: readonly PermissionCatalogEntry[] =
  Object.freeze(Object.values(PERMISSION_CATALOG));
