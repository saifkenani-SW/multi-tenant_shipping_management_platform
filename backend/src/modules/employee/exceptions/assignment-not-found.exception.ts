import { NotFoundException } from '@nestjs/common';

export class AssignmentNotFoundException extends NotFoundException {
  constructor() {
    super('Employee assignment not found');
  }
}
