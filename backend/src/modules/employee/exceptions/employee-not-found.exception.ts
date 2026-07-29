import { NotFoundException } from '@nestjs/common';

export class EmployeeNotFoundException extends NotFoundException {
  constructor() {
    super('Employee not found');
  }
}
