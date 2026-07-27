/**
 * يمثّل ارتباط معرّف الكيان بمفتاحه داخل الـ Cache.
 *
 * يُستخدم في rememberMany لتمرير المفاتيح الجاهزة
 * من الـ Facade إلى الـ Provider.
 */
export interface CacheKeyEntry {
  readonly id: string;
  readonly key: string;
}

/**
 * العقد الأساسي لمزود الـ Cache.
 *
 * أي Implementation (Redis, InMemory, Memcached...)
 * يجب أن ينفذ هذا العقد.
 *
 * لا تعتمد الطبقات العليا على Redis مباشرة،
 * وإنما على هذا العقد فقط.
 */
export interface ICacheProvider {
  /**
   * يجلب قيمة واحدة من الـ Cache.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * يجلب عدة قيم دفعة واحدة.
   */
  getMany<T>(keys: readonly string[]): Promise<Map<string, T>>;

  /**
   * يخزن قيمة واحدة.
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * يخزن عدة قيم دفعة واحدة.
   */
  setMany<T>(
    entries: ReadonlyArray<{
      readonly key: string;
      readonly value: T;
      readonly ttl?: number;
    }>,
  ): Promise<void>;

  /**
   * يحذف مفتاحًا واحدًا.
   */
  del(key: string): Promise<void>;

  /**
   * يحذف جميع المفاتيح المطابقة للـ Pattern.
   */
  delByPattern(pattern: string): Promise<void>;

  /**
   * يطبق Cache-Aside Pattern على قيمة واحدة.
   */
  remember<T>(key: string, loader: () => Promise<T>, ttl?: number): Promise<T>;

  /**
   * يطبق Cache-Aside Pattern على مجموعة عناصر.
   *
   * يتوقع أن تكون المفاتيح النهائية قد بُنيت مسبقًا.
   */
  rememberMany<T extends { id: string }>(
    entries: ReadonlyArray<CacheKeyEntry>,
    loader: (missingIds: readonly string[]) => Promise<readonly T[]>,
    ttl?: number,
  ): Promise<Map<string, T>>;

  /**
   * يفحص صحة مزود الـ Cache.
   */
  isHealthy(): Promise<boolean>;
}
