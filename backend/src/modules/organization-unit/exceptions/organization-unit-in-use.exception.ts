import { ConflictException } from '@nestjs/common';

/**
 * employee_assignment مرتبطة بالوحدة عبر cascade: الحذف يلغي تعيينات
 * موظفين قائمة بصمت.
 */
export class OrganizationUnitInUseException extends ConflictException {
  constructor(assignmentCount: number) {
    super(
      `Unit still has ${assignmentCount} active employee assignment(s). Reassign them first, or deactivate the unit instead.`,
    );
  }
}
