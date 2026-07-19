import { Logger } from '@nestjs/common';
import { ICacheProvider } from '../interfaces/ICacheProvider';

const logger = new Logger('Cacheable');

export interface CacheableOptions {
  /**
   * مدة الـ cache بالثواني.
   * @default 300 (5 دقائق)
   */
  ttl?: number;

  /**
   * prefix للـ cache key إذا لم تستخدم keyBuilder.
   * إذا لم يُحدد → يستخدم اسم الـ method.
   */
  keyPrefix?: string;

  /**
   * دالة مخصصة لبناء الـ cache key من الـ arguments.
   * @example keyBuilder: (id, tenantId) => `shipment:${tenantId}:${id}`
   */
  keyBuilder?: (...args: any[]) => string;
}

function buildDefaultKey(prefix: string, args: any[]): string {
  return `${prefix}:${args.map((a) => JSON.stringify(a)).join(':')}`;
}

/**
 * @Cacheable — يكاش نتيجة الـ method في الـ Cache Provider.
 *
 * يقرأ `this.cacheProvider` من الـ instance (يجب أن يكون public).
 *
 * سلوك الـ Fail-Safe (ثلاثة مستويات):
 *  1. ما في provider       → يشتغل مباشرة بدون cache
 *  2. فشل GET (أو OPEN)    → يشتغل مباشرة بدون cache
 *  3. فشل SET              → يرجع البيانات، يتجاهل فشل الـ cache
 *
 * @example
 * @Cacheable({ ttl: 300, keyBuilder: (id, tid) => `shipment:${tid}:${id}` })
 * async findById(id: string, tenantId: string) { ... }
 */
export function Cacheable(options: CacheableOptions = {}): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: any[]) {
      const cacheProvider: ICacheProvider | undefined = this.cacheProvider;

      // Fail-Safe #1: ما في provider
      if (!cacheProvider) {
        return originalMethod.apply(this, args);
      }

      const key = options.keyBuilder
        ? options.keyBuilder(...args)
        : buildDefaultKey(options.keyPrefix ?? methodName, args);

      // Fail-Safe #2: فشل GET أو Circuit OPEN
      try {
        const cached = await cacheProvider.get(key);
        if (cached !== null) {
          logger.debug(`HIT  key="${key}"`);
          return cached;
        }
        logger.debug(`MISS key="${key}"`);
      } catch (err: any) {
        logger.warn(
          `GET failed key="${key}" → fallback to DB. Reason: ${err.message}`,
        );
        return originalMethod.apply(this, args);
      }

      // Cache Miss → اذهب للـ DB
      const result = await originalMethod.apply(this, args);

      // Fail-Safe #3: فشل SET لا يكسر الـ request
      try {
        if (result !== null && result !== undefined) {
          await cacheProvider.set(key, result, options.ttl ?? 300);
          logger.debug(`SET  key="${key}" ttl=${options.ttl ?? 300}s`);
        }
      } catch (err: any) {
        logger.warn(`SET failed key="${key}": ${err.message}`);
      }

      return result;
    };

    return descriptor;
  };
}
