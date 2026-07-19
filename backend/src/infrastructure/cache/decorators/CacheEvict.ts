import { Logger } from '@nestjs/common';
import { ICacheProvider } from '../interfaces/ICacheProvider';

const logger = new Logger('CacheEvict');

export interface CacheEvictOptions {
  /**
   * الـ prefix المستخدم للـ key أو الـ pattern.
   */
  keyPrefix: string;

  /**
   * دالة مخصصة لبناء الـ key من الـ arguments.
   */
  keyBuilder?: (...args: any[]) => string;

  /**
   * إذا true → يمسح كل الـ keys التي تبدأ بـ keyPrefix:*
   * مفيد بعد حذف أو bulk update.
   * @default false
   */
  allEntries?: boolean;
}

function buildDefaultKey(prefix: string, args: any[]): string {
  return `${prefix}:${args.map((a) => JSON.stringify(a)).join(':')}`;
}

/**
 * @CacheEvict — يمسح الـ cache بعد اكتمال الـ Command.
 *
 * ⚠️  ينفذ الـ Command أولاً ثم يمسح الـ cache.
 *     لو فشل المسح → الـ Command مكتمل، فقط log.
 *
 * @example
 * // مسح key محدد
 * @CacheEvict({ keyPrefix: 'shipment', keyBuilder: (dto) => `shipment:${dto.tenantId}:${dto.id}` })
 *
 * // مسح كل shipments لـ tenant
 * @CacheEvict({ keyPrefix: 'shipment', allEntries: true })
 */
export function CacheEvict(options: CacheEvictOptions): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // ① نفذ الـ Command أولاً — الـ Write يكتمل دائماً
      const result = await originalMethod.apply(this, args);

      // ② امسح الـ cache
      const cacheProvider: ICacheProvider | undefined = this.cacheProvider;
      if (!cacheProvider) return result;

      try {
        if (options.allEntries) {
          const pattern = `${options.keyPrefix}:*`;
          await cacheProvider.delByPattern(pattern);
          logger.debug(`EVICT pattern="${pattern}"`);
        } else {
          const key = options.keyBuilder
            ? options.keyBuilder(...args)
            : buildDefaultKey(options.keyPrefix, args);
          await cacheProvider.del(key);
          logger.debug(`EVICT key="${key}"`);
        }
      } catch (err: any) {
        // الـ Write مكتمل — لا تكسره بسبب فشل الـ cache eviction
        logger.warn(`EVICT failed: ${err.message}`);
      }

      return result;
    };

    return descriptor;
  };
}
