import { ConflictException } from '@nestjs/common';

/** يقابل uq_employee_org_unit: تعيين واحد لكل موظف على كل وحدة. */
export class DuplicateAssignmentException extends ConflictException {
  constructor() {
    super('This employee is already assigned to that organization unit');
  }
}
