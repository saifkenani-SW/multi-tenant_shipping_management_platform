export enum RoleAction {
  View = 'view',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  /** تعديل صلاحيات الدور — أخطر من تعديل اسمه، فله فعل منفصل. */
  ManagePermissions = 'manage-permissions',
}
