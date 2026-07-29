import { EmployeeAssignment } from './employee-assignment.entity';

/**
 * Employee Domain Entity.
 *
 * جذر تجميع يضم تعييناته (employee_assignment) وأدوار كل تعيين
 * (assignment_role). مرتبط بحساب في users، وهو ما يجعل إنشاءه يعبر
 * حدود موديول الهوية.
 *
 * `assignments` تُملأ عند قراءة التفاصيل فقط.
 */
export class Employee {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly employeeCode: string,
    public readonly fullName: string,
    public readonly nationalId: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deactivatedAt: Date | null = null,
    public readonly email: string | null = null,
    public readonly phone: string | null = null,
    public readonly assignments: readonly EmployeeAssignment[] = [],
  ) {}
}
