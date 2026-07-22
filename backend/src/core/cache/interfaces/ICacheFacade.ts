/**
 * الواجهة العليا للتعامل مع نظام الـ Cache.
 *
 * مسؤولياتها:
 * - بناء مفاتيح الـ Cache.
 * - توفير API موحد للـ Decorators والـ Services.
 * - عزل الطبقات العليا عن تفاصيل الـ Provider.
 */
export interface ICacheFacade {
  /**
   * يطبق Cache-Aside Pattern على قيمة واحدة.
   *
   * يقوم ببناء المفتاح النهائي قبل تفويض التنفيذ
   * إلى الـ Cache Provider.
   */
  remember<T>(
    keyParts: readonly unknown[],
    loader: () => Promise<T>,
    ttl?: number,
  ): Promise<T>;

  /**
   * يطبق Cache-Aside Pattern على مجموعة عناصر.
   *
   * يقوم ببناء جميع المفاتيح النهائية ثم يفوض
   * التنفيذ إلى الـ Cache Provider.
   */
  rememberMany<T extends { id: string }>(
    keyPrefix: string,
    ids: readonly string[],
    loader: (missingIds: readonly string[]) => Promise<readonly T[]>,
    ttl?: number,
  ): Promise<Map<string, T>>;

  /**
   * يحذف قيمة واحدة من الـ Cache.
   */
  evict(keyParts: readonly unknown[]): Promise<void>;

  /**
   * يحذف جميع المفاتيح التي تبدأ بالـ Prefix المحدد.
   */
  evictByPrefix(prefix: string): Promise<void>;
}
