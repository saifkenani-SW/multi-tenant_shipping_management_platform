import { Permission } from '../../permission/domain/permission.entity';

/**
 * Role Domain Entity.
 *
 * الدور جذر تجميع يضم صلاحياته (role_permission)، ويخص tenant واحداً
 * دائماً — لا توجد أدوار عامة على مستوى المنصة.
 *
 * `permissions` تُملأ عند قراءة التفاصيل فقط؛ القوائم تتركها فارغة
 * تفادياً لاستعلام لكل صف.
 */
export class Role {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly permissions: readonly Permission[] = [],
  ) {}
}
