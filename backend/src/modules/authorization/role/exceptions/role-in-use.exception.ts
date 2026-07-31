import { ConflictException } from '@nestjs/common';

/**
 * حذف دور مُسنَد يُسقط صفوف assignment_role بالـ cascade، أي يسحب
 * صلاحيات موظفين قائمين بصمت. نمنع الحذف ونطلب إلغاء الإسناد أولاً.
 */
export class RoleInUseException extends ConflictException {
  constructor(assignmentCount: number) {
    super(
      `Role is still assigned to ${assignmentCount} employee assignment(s). Unassign it first, or deactivate the role instead.`,
    );
  }
}
