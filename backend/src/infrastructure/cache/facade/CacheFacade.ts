import { Inject, Injectable, Logger } from '@nestjs/common';
import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';
import type { ICacheKeyBuilder } from '../../../core/cache/interfaces/ICacheKeyBuilder';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import {
  CACHE_KEY_BUILDER,
  CACHE_PROVIDER,
} from '../../../core/cache/tokens/cache.tokens';

/**
 * الواجهة العليا للتعامل مع نظام الـ Cache.
 *
 * المسؤوليات:
 * - بناء مفاتيح الـ Cache باستخدام ICacheKeyBuilder.
 * - توفير API موحد للـ Decorators والـ Services.
 * - عزل الطبقات العليا عن تفاصيل مزود الـ Cache.
 *
 * لا يحتوي هذا الكلاس على أي منطق خاص بـ Redis،
 * وإنما يفوض جميع العمليات إلى ICacheProvider.
 */
@Injectable()
export class CacheFacade implements ICacheFacade {
  private readonly logger = new Logger(CacheFacade.name);

  constructor(
    @Inject(CACHE_PROVIDER)
    private readonly cache: ICacheProvider,

    @Inject(CACHE_KEY_BUILDER)
    private readonly keyBuilder: ICacheKeyBuilder,
  ) {}

  /**
   * يطبق Cache-Aside Pattern على عنصر واحد.
   *
   * يبني المفتاح النهائي ثم يفوض التنفيذ إلى الـ Provider.
   *
   * @param keyParts أجزاء المفتاح.
   * @param loader يستدعى فقط عند Cache Miss.
   * @param ttl مدة التخزين بالثواني.
   */
  async remember<T>(
    keyParts: readonly unknown[],
    loader: () => Promise<T>,
    ttl = 300,
  ): Promise<T> {
    const key = this.keyBuilder.build(keyParts);

    this.logger.debug(`REMEMBER key="${key}"`);

    return this.cache.remember(key, loader, ttl);
  }

  /**
   * يطبق Cache-Aside Pattern على مجموعة عناصر.
   *
   * يبني المفاتيح النهائية لجميع الـ IDs ثم يفوض
   * التنفيذ إلى الـ Provider.
   *
   * @param keyPrefix بادئة المفاتيح.
   * @param ids المعرفات المطلوبة.
   * @param loader يستدعى فقط للـ IDs غير الموجودة.
   * @param ttl مدة التخزين بالثواني.
   */
  async rememberMany<T extends { id: string }>(
    keyPrefix: string,
    ids: readonly string[],
    loader: (missingIds: readonly string[]) => Promise<readonly T[]>,
    ttl = 300,
  ): Promise<Map<string, T>> {
    const uniqueIds = [...new Set(ids)];

    const entries = uniqueIds.map((id) => ({
      id,
      key: this.keyBuilder.build([keyPrefix, id]),
    }));

    this.logger.debug(
      `REMEMBER_MANY prefix="${keyPrefix}" requested=${entries.length}`,
    );

    return this.cache.rememberMany(entries, loader, ttl);
  }

  /**
   * يحذف قيمة واحدة من الـ Cache.
   *
   * @param keyParts أجزاء المفتاح.
   */
  async evict(keyParts: readonly unknown[]): Promise<void> {
    const key = this.keyBuilder.build(keyParts);

    await this.cache.del(key);

    this.logger.debug(`EVICT key="${key}"`);
  }

  /**
   * يحذف جميع المفاتيح المطابقة للـ Prefix.
   *
   * مثال:
   * user:*
   * shipment:tenant-1:*
   *
   * @param prefix بادئة المفاتيح.
   */
  async evictByPrefix(prefix: string): Promise<void> {
    const pattern = `${prefix}:*`;

    await this.cache.delByPattern(pattern);

    this.logger.debug(`EVICT pattern="${pattern}"`);
  }
}
