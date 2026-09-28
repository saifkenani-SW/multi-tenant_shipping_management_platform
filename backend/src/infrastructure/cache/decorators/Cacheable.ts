import { Logger } from '@nestjs/common';
import { CacheContainer } from '../container/CacheContainer';
import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';
import { CACHE_FACADE } from '../../../core/cache/tokens/cache.tokens';
import { CacheableOptions } from './cacheable-options.type';
import { CacheStrategy } from './cache-strategy.enum';
import { RequestCacheStore } from '../request/RequestCacheStore';
import { CacheKeyBuilder } from '../builders/CacheKeyBuilder';

const logger = new Logger(Cacheable.name);

/**
 * يطبق Cache-Aside Pattern على نتائج الدوال بطبقتين:
 *
 * الطبقة الأولى — Request Cache (AsyncLocalStorage):
 * - مرتبط بعمر الـ Request الواحد.
 * - يمنع ضرب Redis أكثر من مرة لنفس المفتاح في نفس الطلب.
 * - يُفعَّل افتراضياً (requestCache: true).
 *
 * الطبقة الثانية — CacheFacade (Redis / InMemory):
 * - يُستدعى فقط عند Cache Miss في الطبقة الأولى.
 * - عند Cache Miss في Redis أيضاً، يُنفَّذ الـ loader (DB).
 *
 * التسلسل الكامل:
 * 1. تحقق من Request Cache → HIT: أرجع القيمة
 * 2. تحقق من Redis → HIT: خزّن في Request Cache وأرجع
 * 3. نفّذ loader (DB) → خزّن في Redis + Request Cache وأرجع
 *
 * يدعم استراتيجيتين:
 * - SINGLE: لتخزين نتيجة عنصر واحد.
 * - MANY: لتخزين واسترجاع عدة عناصر دفعة واحدة.
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
    const useRequestCache = options.requestCache !== false;

    descriptor.value = async function (...args: unknown[]) {
      const cacheFacade = CacheContainer.get<ICacheFacade>(CACHE_FACADE);

      logger.debug(`Intercept "${methodName}"`);

      // ──────────────────────────────────────────────
      // MANY Strategy
      // ──────────────────────────────────────────────
      if (options.strategy === CacheStrategy.MANY) {
        const allIds = options.ids(...args);

        if (useRequestCache) {
          const keyBuilder = new CacheKeyBuilder();
          const prefix = options.keyPrefix ?? methodName;

          // فصل الـ IDs: موجودة في Request Cache / غائبة
          const requestHits = new Map<string, unknown>();
          const missingInRequest: string[] = [];

          for (const id of allIds) {
            const requestKey = keyBuilder.build([prefix, id]);
            const cached = RequestCacheStore.get(requestKey);

            if (cached !== undefined) {
              requestHits.set(id, cached);
              logger.debug(`REQUEST_HIT key="${requestKey}"`);
            } else {
              missingInRequest.push(id);
            }
          }

          // إذا كل الـ IDs موجودة في Request Cache
          if (missingInRequest.length === 0) {
            return requestHits;
          }

          // جلب الباقي من Redis
          const redisArgs = options.loader(args, missingInRequest);
          const redisResult = await cacheFacade.rememberMany(
            prefix,
            missingInRequest,
            async (stillMissing) => {
              const loaderArgs = options.loader(args, stillMissing);
              return originalMethod.apply(this, loaderArgs);
            },
            options.ttl,
          );

          // تخزين نتائج Redis في Request Cache
          for (const [id, value] of redisResult) {
            const requestKey = keyBuilder.build([prefix, id]);
            RequestCacheStore.set(requestKey, value);
          }

          // دمج Request Cache Hits مع Redis Results
          const merged = new Map([...requestHits, ...redisResult]);

          return merged;
        }

        // بدون Request Cache
        return cacheFacade.rememberMany(
          options.keyPrefix ?? methodName,
          allIds,
          async (missingIds) => {
            const loaderArgs = options.loader(args, missingIds);
            return originalMethod.apply(this, loaderArgs);
          },
          options.ttl,
        );
      }

      // ──────────────────────────────────────────────
      // SINGLE Strategy
      // ──────────────────────────────────────────────
      const keyParts = options.keyBuilder
        ? options.keyBuilder(...args)
        : [options.keyPrefix ?? methodName, ...args];

      // بناء مفتاح موحد للـ Request Cache
      const requestKey = keyParts.join(':');

      if (useRequestCache) {
        const requestCached = RequestCacheStore.get(requestKey);

        if (requestCached !== undefined) {
          logger.debug(`REQUEST_HIT key="${requestKey}"`);
          return requestCached;
        }
      }

      const result = await cacheFacade.remember(
        keyParts,
        () => originalMethod.apply(this, args),
        options.ttl,
      );

      if (useRequestCache) {
        RequestCacheStore.set(requestKey, result);
      }

      return result;
    };

    return descriptor;
  };
}
