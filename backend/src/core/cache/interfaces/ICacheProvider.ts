/**
 * العقد الأساسي للـ Cache Provider.
 * أي implementation (Redis, InMemory, Memcached...) يجب أن تنفذ هذا.
 * الـ Service والـ Decorators تتعامل مع هذا العقد فقط — لا يعرفون Redis.
 */
export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;

  /**
   * يمسح كل الـ keys التي تطابق الـ pattern.
   * مثال: delByPattern('shipment:tenant-1:*')
   * ⚠️  استخدم SCAN في production وليس KEYS — انظر RedisCacheProvider
   */
  delByPattern(pattern: string): Promise<void>;

  /**
   * فحص صحة الـ provider — يستخدمه الـ Circuit Breaker.
   * يرجع true إذا كان الـ provider يعمل.
   */
  isHealthy(): Promise<boolean>;
}
