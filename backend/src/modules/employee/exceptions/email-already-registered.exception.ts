import { ConflictException } from '@nestjs/common';

/**
 * users.email فريد على مستوى المنصة كلها، لا داخل الشركة: نفس البريد
 * لا يصلح لموظف في شركتين.
 */
export class EmailAlreadyRegisteredException extends ConflictException {
  constructor() {
    super('This email is already registered');
  }
}
