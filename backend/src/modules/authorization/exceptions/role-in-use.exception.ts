import { ConflictException } from '@nestjs/common';

export class RoleInUseException extends ConflictException {
  constructor(assignmentCount: number) {
    super(
      `Role is still assigned to ${assignmentCount} employee assignment(s). Unassign it first, or deactivate the role instead.`,
    );
  }
}
