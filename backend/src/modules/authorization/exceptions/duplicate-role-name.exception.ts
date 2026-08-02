import { ConflictException } from '@nestjs/common';

export class DuplicateRoleNameException extends ConflictException {
  constructor(name: string) {
    super(`A role named "${name}" already exists for this tenant`);
  }
}
