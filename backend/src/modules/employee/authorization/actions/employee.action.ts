export enum EmployeeAction {
  View = 'view',
  Create = 'create',
  Update = 'update',
  /** التفعيل والتعطيل: يوقفان الدخول، ففعل منفصل عن تعديل الاسم. */
  ChangeStatus = 'change-status',
  /** التعيينات والأدوار: تحدد ما يستطيع الموظف فعله فعلياً. */
  ManageAssignments = 'manage-assignments',
}
