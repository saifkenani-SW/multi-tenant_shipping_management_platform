/**
 * Permission Domain Entity.
 *
 * الصلاحيات كتالوج عام لا ينتمي لأي tenant: تُعرَّف في الكود
 * (`core/security/Permission`) وتُزرع في قاعدة البيانات لتتمكن الأدوار
 * من الإشارة إليها بمفتاح أجنبي.
 */
export class Permission {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description: string | null = null,
  ) {}
}
