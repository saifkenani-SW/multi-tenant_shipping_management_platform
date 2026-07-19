import { Logger } from '@nestjs/common';
import { CacheContainer } from '../container/CacheContainer';
import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';
import { CACHE_FACADE } from '../../../core/cache/tokens/cache.tokens';
import { CacheableOptions } from './cacheable-options.type';
import { CacheStrategy } from './cache-strategy.enum';

const logger = new Logger(Cacheable.name);

/**
 * يطبق Cache-Aside Pattern على نتائج الدوال.
 *
 * عند استدعاء الدالة، يحاول قراءة النتيجة من الـ Cache أولاً،
 * وفي حال عدم وجودها يتم تنفيذ الدالة الأصلية ثم تخزين النتيجة
 * وإعادتها للمستدعي.
 *
 * يدعم استراتيجيتين:
 * - SINGLE: لتخزين نتيجة عنصر واحد.
 * - MANY: لتخزين واسترجاع عدة عناصر دفعة واحدة.
 *
 * يعتمد هذا الـ Decorator على CacheFacade، لذلك لا يحتوي
 * أي منطق خاص ببناء المفاتيح أو بمزود الـ Cache.
 *
 * @param options خيارات التحكم بسلوك التخزين المؤقت.
 */
export function Cacheable(options: CacheableOptions = {}): MethodDecorator {
  return (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: unknown[]) {
      const cacheFacade = CacheContainer.get<ICacheFacade>(CACHE_FACADE);

      logger.debug(`Intercept "${methodName}"`);

      if (options.strategy === CacheStrategy.MANY) {
        return cacheFacade.rememberMany(
          options.keyPrefix ?? methodName,
          options.ids(...args),
          async (missingIds) => {
            const loaderArgs = options.loader(args, missingIds);

            return originalMethod.apply(this, loaderArgs);
          },
          options.ttl,
        );
      }

      const keyParts = options.keyBuilder
        ? options.keyBuilder(...args)
        : [options.keyPrefix ?? methodName, ...args];

      return cacheFacade.remember(
        keyParts,
        () => originalMethod.apply(this, args),
        options.ttl,
      );
    };

    return descriptor;
  };
}
