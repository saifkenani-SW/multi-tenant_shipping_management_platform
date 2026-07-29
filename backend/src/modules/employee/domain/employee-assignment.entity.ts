/**
 * تعيين موظف على وحدة تنظيمية، ومعه الأدوار الممنوحة في ذلك الموضع.
 *
 * الأدوار مربوطة بالتعيين لا بالموظف: نفس الشخص قد يكون مدير فرع في
 * موقع ومناوباً في آخر.
 */
export class EmployeeAssignment {
  constructor(
    public readonly id: string,
    public readonly employeeId: string,
    public readonly organizationUnitId: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly roleIds: readonly string[] = [],
    public readonly organizationUnitName: string | null = null,
  ) {}
}
