import { Logger } from '@nestjs/common';

import { CacheContainer } from '../container/CacheContainer';

import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';

import { CACHE_FACADE } from '../../../core/cache/tokens/cache.tokens';

const logger = new Logger(CacheEvict.name);

export interface CacheEvictOptions {
  /**
   * Prefix المستخدم عند حذف جميع الـ entries.
   */
  keyPrefix: string;

  /**
   * يبني أجزاء المفتاح.
   */
  keyBuilder?: (...args: unknown[]) => readonly unknown[];

  /**
   * حذف جميع الـ entries التابعة للـ prefix.
   */
  allEntries?: boolean;
}

/**
 * يحذف الكاش بعد نجاح العملية.
 *
 * إذا فشل حذف الكاش فلن يفشل الـ Command.
 */
export function CacheEvict(options: CacheEvictOptions): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      const cacheFacade = CacheContainer.get<ICacheFacade>(CACHE_FACADE);

      try {
        if (options.allEntries) {
          await cacheFacade.evictByPrefix(options.keyPrefix);
        } else {
          const keyParts = options.keyBuilder
            ? options.keyBuilder(...args)
            : [options.keyPrefix, ...args];

          await cacheFacade.evict(keyParts);
        }
      } catch (err) {
        logger.warn(
          `Cache eviction failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      return result;
    };

    return descriptor;
  };
}
