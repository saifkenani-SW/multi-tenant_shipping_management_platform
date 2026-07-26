import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import CircuitBreaker from 'opossum';
import {
  CacheKeyEntry,
  ICacheProvider,
} from 'src/core/cache/interfaces/ICacheProvider';

/**
 * خيارات تهيئة RedisCacheProvider.
 */
export interface RedisCacheProviderOptions {
  /**
   * خيارات Circuit Breaker.
   *
   * تستخدم لتخصيص سلوك مكتبة Opossum مثل:
   * - timeout
   * - resetTimeout
   * - errorThresholdPercentage
   * - volumeThreshold
   */
  circuitBreaker?: CircuitBreaker.Options;

  /**
   * عدد المفاتيح التي يقرأها أمر SCAN في كل دورة.
   *
   * يستخدم فقط في عمليات الحذف بالـ Pattern.
   *
   * @default 100
   */
  scanCount?: number;
}

/**
 * تنفيذ Redis لعقد ICacheProvider.
 *
 * يوفر:
 * - Cache-Aside Pattern.
 * - Single & Bulk Operations.
 * - Redis Pipeline.
 * - Pattern Eviction باستخدام SCAN.
 * - Circuit Breaker بواسطة Opossum.
 * - Fail-Safe عند تعطل Redis.
 *
 * جميع العمليات التي قد تفشل بسبب Redis يتم احتواؤها داخليًا
 * حتى لا تؤثر على منطق التطبيق.
 */
@Injectable()
export class RedisCacheProvider implements ICacheProvider, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheProvider.name);

  /**
   * Circuit Breaker المستخدم لحماية التطبيق
   * من بطء Redis أو تعطلها.
   */
  private readonly breaker: CircuitBreaker<[() => Promise<any>], any>;

  /**
   * عدد المفاتيح التي يتم قراءتها في كل دورة SCAN.
   */
  private readonly scanCount: number;

  constructor(
    /**
     * عميل Redis المستخدم لتنفيذ جميع العمليات.
     */
    private readonly redis: Redis,

    /**
     * خيارات تهيئة الـ Provider.
     */
    options: RedisCacheProviderOptions = {},
  ) {
    this.scanCount = options.scanCount ?? 100;

    this.breaker = new CircuitBreaker<[() => Promise<any>], any>(
      async (action: () => Promise<any>) => await action(),
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30_000,
        volumeThreshold: 10,
        ...options.circuitBreaker,
      },
    );

    this._setupBreakerEvents();
  }

  // ─────────────────────────────────────────────────────────────
  // High-Level Cache API (Cache-Aside)
  // ─────────────────────────────────────────────────────────────

  /**
   * يطبق نمط Cache-Aside على قيمة واحدة.
   *
   * آلية العمل:
   * 1. محاولة جلب القيمة من الـ Cache.
   * 2. عند وجودها (Cache Hit) تعاد مباشرة.
   * 3. عند عدم وجودها (Cache Miss) يستدعى loader.
   * 4. تخزن النتيجة داخل الـ Cache.
   * 5. تعاد النتيجة للمستدعي.
   *
   * لا يرمي Exceptions ناتجة عن Redis، إذ تتعامل معها
   * عمليات القراءة والكتابة منخفضة المستوى بطريقة Fail-Safe.
   *
   * @param key المفتاح الكامل داخل الـ Cache.
   * @param loader يستدعى فقط عند عدم وجود القيمة داخل الـ Cache.
   * @param ttl مدة الاحتفاظ بالقيمة داخل الـ Cache بالثواني.
   *
   * @returns القيمة المطلوبة سواءً من الـ Cache أو من الـ loader.
   */
  async remember<T>(
    key: string,
    loader: () => Promise<T>,
    ttl = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      this.logger.debug(`HIT key="${key}"`);
      return cached;
    }

    this.logger.debug(`MISS key="${key}"`);

    const value = await loader();

    await this.set(key, value, ttl);

    this.logger.debug(`SET key="${key}" ttl=${ttl}s`);

    return value;
  }

  /**
   * يطبق نمط Cache-Aside على مجموعة عناصر.
   *
   * يتوقع أن تكون جميع مفاتيح الـ Cache قد بُنيت مسبقًا
   * بواسطة الطبقة العليا (عادةً CacheFacade).
   *
   * آلية العمل:
   * 1. جلب جميع المفاتيح دفعة واحدة باستخدام MGET.
   * 2. تحديد العناصر غير الموجودة داخل الـ Cache.
   * 3. استدعاء loader للعناصر الناقصة فقط.
   * 4. تخزين النتائج باستخدام Pipeline.
   * 5. دمج النتائج وإرجاع Map تربط كل ID بالكيان الموافق له.
   *
   * لا يعرف هذا الكلاس كيفية بناء المفاتيح، بل يتعامل معها
   * كمفاتيح جاهزة وفق مبدأ فصل المسؤوليات.
   *
   * @param cacheKeys تربط كل ID بالمفتاح الكامل داخل الـ Cache.
   * @param loader يستدعى فقط للعناصر غير الموجودة.
   * @param ttl مدة الاحتفاظ بالقيم داخل الـ Cache بالثواني.
   *
   * @returns Map تربط كل ID بالكيان الموافق له.
   */
  async rememberMany<T extends { id: string }>(
    cacheKeys: ReadonlyArray<CacheKeyEntry>,
    loader: (missingIds: readonly string[]) => Promise<readonly T[]>,
    ttl = 300,
  ): Promise<Map<string, T>> {
    if (cacheKeys.length === 0) {
      this.logger.debug('rememberMany skipped (empty input)');
      return new Map();
    }

    const cached = await this.getMany<T>(cacheKeys.map((entry) => entry.key));

    const missingIds = cacheKeys
      .filter((entry) => !cached.has(entry.key))
      .map((entry) => entry.id);

    this.logger.debug(
      `MGET requested=${cacheKeys.length} hit=${cached.size} miss=${missingIds.length}`,
    );

    if (missingIds.length > 0) {
      const loaded = await loader(missingIds);

      const keyMap = new Map(cacheKeys.map((entry) => [entry.id, entry.key]));

      const entries: Array<{
        key: string;
        value: T;
        ttl: number;
      }> = [];

      for (const entity of loaded) {
        const key = keyMap.get(entity.id);

        if (!key) {
          this.logger.warn(
            `Skipping entity with unexpected id="${entity.id}" returned by loader`,
          );
          continue;
        }

        entries.push({
          key,
          value: entity,
          ttl,
        });

        cached.set(key, entity);
      }

      await this.setMany(entries);

      this.logger.debug(`MSET stored=${entries.length} ttl=${ttl}s`);
    }

    const result = new Map<string, T>();

    for (const entry of cacheKeys) {
      const entity = cached.get(entry.key);

      if (entity) {
        result.set(entry.id, entity);
      }
    }

    this.logger.debug(`RETURN count=${result.size}`);

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // Low-Level Read Operations
  // ─────────────────────────────────────────────────────────────

  /**
   * يجلب قيمة واحدة من الـ Cache.
   *
   * آلية العمل:
   * 1. تنفيذ GET على Redis.
   * 2. تحويل القيمة من JSON إلى الكائن الأصلي.
   * 3. إعادة null عند عدم وجود المفتاح.
   *
   * تستخدم هذه الدالة داخليًا بواسطة remember()، كما يمكن
   * استخدامها مباشرة عند الحاجة إلى قراءة قيمة من الـ Cache
   * دون تطبيق Cache-Aside Pattern.
   *
   * تعتمد على Circuit Breaker، وعند فشل Redis تعيد null
   * بطريقة Fail-Safe دون رمي Exception.
   *
   * @param key المفتاح الكامل داخل الـ Cache.
   *
   * @returns القيمة المخزنة أو null إذا لم تكن موجودة أو تعذر الوصول إلى Redis.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.breaker.fire(() => this.redis.get(key));

      return value ? (JSON.parse(value) as T) : null;
    } catch (err: any) {
      this._logError('GET', key, err);
      return null;
    }
  }

  /**
   * يجلب مجموعة قيم دفعة واحدة باستخدام Redis MGET.
   *
   * تعاد فقط المفاتيح الموجودة داخل الـ Cache،
   * بينما يتم تجاهل المفاتيح غير الموجودة.
   *
   * تستخدم هذه الدالة داخليًا بواسطة rememberMany() لتقليل
   * عدد الطلبات المرسلة إلى Redis وتحسين الأداء.
   *
   * تعتمد على Circuit Breaker، وعند فشل Redis تعيد Map فارغة
   * بطريقة Fail-Safe دون رمي Exception.
   *
   * @param keys المفاتيح الكاملة المطلوب قراءتها.
   *
   * @returns Map تربط كل مفتاح بالقيمة الموجودة له داخل الـ Cache.
   */
  async getMany<T>(keys: readonly string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    if (keys.length === 0) {
      return result;
    }

    try {
      const values = await this.breaker.fire(() => this.redis.mget(...keys));

      values.forEach((value, index) => {
        if (value !== null) {
          result.set(keys[index], JSON.parse(value) as T);
        }
      });

      return result;
    } catch (err: any) {
      this._logError('MGET', keys.join(','), err);
      return result;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Low-Level Write Operations
  // ─────────────────────────────────────────────────────────────

  /**
   * يخزن قيمة واحدة داخل الـ Cache.
   *
   * آلية العمل:
   * 1. تحويل القيمة إلى JSON.
   * 2. تنفيذ SET مع تحديد مدة الصلاحية (TTL).
   *
   * تستخدم هذه الدالة داخليًا بواسطة remember()، كما يمكن
   * استخدامها مباشرة لتحديث الـ Cache دون تطبيق Cache-Aside.
   *
   * تعتمد على Circuit Breaker، وعند فشل Redis يتم تجاهل
   * الخطأ بطريقة Fail-Safe حتى لا يتأثر التطبيق.
   *
   * @param key المفتاح الكامل داخل الـ Cache.
   * @param value القيمة المراد تخزينها.
   * @param ttl مدة الاحتفاظ بالقيمة داخل الـ Cache بالثواني.
   */
  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    try {
      await this.breaker.fire(() =>
        this.redis.set(key, JSON.stringify(value), 'EX', ttl),
      );
    } catch (err: any) {
      this._logError('SET', key, err);
    }
  }

  /**
   * يخزن مجموعة قيم دفعة واحدة باستخدام Redis Pipeline.
   *
   * آلية العمل:
   * 1. إنشاء Pipeline.
   * 2. إضافة جميع أوامر SET إلى الـ Pipeline.
   * 3. تنفيذها دفعة واحدة لتقليل عدد الاتصالات مع Redis.
   *
   * تستخدم هذه الدالة داخليًا بواسطة rememberMany()، كما يمكن
   * استخدامها مباشرة عند الحاجة لتحديث عدة مفاتيح دفعة واحدة.
   *
   * تعتمد على Circuit Breaker، وعند فشل Redis يتم تجاهل
   * الخطأ بطريقة Fail-Safe حتى لا يتأثر التطبيق.
   *
   * @param entries العناصر المطلوب تخزينها داخل الـ Cache.
   */
  async setMany<T>(
    entries: ReadonlyArray<{
      key: string;
      value: T;
      ttl?: number;
    }>,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    try {
      await this.breaker.fire(async () => {
        const pipeline = this.redis.pipeline();

        for (const entry of entries) {
          pipeline.set(
            entry.key,
            JSON.stringify(entry.value),
            'EX',
            entry.ttl ?? 300,
          );
        }

        await pipeline.exec();
      });
    } catch (err: any) {
      this._logError('MSET', 'pipeline', err);
    }
  }

  /**
   * يحذف مفتاحًا واحدًا من الـ Cache.
   *
   * تستخدم هذه الدالة لإزالة قيمة مخزنة عند انتهاء صلاحيتها
   * منطقيًا أو بعد تعديل البيانات المرتبطة بها.
   *
   * تعتمد على Circuit Breaker، وعند فشل Redis يتم تجاهل
   * الخطأ بطريقة Fail-Safe حتى لا يتأثر التطبيق.
   *
   * @param key المفتاح الكامل المراد حذفه من الـ Cache.
   */
  async del(key: string): Promise<void> {
    try {
      await this.breaker.fire(() => this.redis.unlink(key));
    } catch (err: any) {
      this._logError('DEL', key, err);
    }
  }

  /**
   * يحذف جميع المفاتيح المطابقة لنمط (Pattern) معين.
   *
   * آلية العمل:
   * 1. البحث عن المفاتيح باستخدام SCAN لتجنب حجب Redis.
   * 2. تجميع جميع المفاتيح المطابقة.
   * 3. حذفها دفعة واحدة باستخدام Pipeline.
   *
   * يستخدم SCAN بدلاً من KEYS لأنه مناسب لبيئات الإنتاج
   * ولا يحجب خادم Redis أثناء البحث.
   *
   * تعتمد هذه العملية على Circuit Breaker، وعند فشل Redis
   * يتم تجاهل الخطأ بطريقة Fail-Safe.
   *
   * @param pattern نمط المفاتيح المراد حذفها، مثل:
   * - user:*
   * - product:123:*
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      await this.breaker.fire(async () => {
        let cursor = '0';
        const keysToDelete: string[] = [];

        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            this.scanCount,
          );

          cursor = nextCursor;
          keysToDelete.push(...keys);
        } while (cursor !== '0');

        if (keysToDelete.length === 0) {
          return;
        }

        const pipeline = this.redis.pipeline();

        for (const key of keysToDelete) {
          pipeline.unlink(key);
        }

        await pipeline.exec();

        this.logger.debug(
          `Deleted ${keysToDelete.length} keys matching "${pattern}"`,
        );
      });
    } catch (err: any) {
      this._logError('DEL_PATTERN', pattern, err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Health & Lifecycle
  // ─────────────────────────────────────────────────────────────

  /**
   * يفحص صحة الاتصال مع Redis.
   *
   * تنفذ عملية PING مباشرة دون المرور عبر Circuit Breaker،
   * لأن الهدف هو قياس الحالة الفعلية للاتصال وليس الاستفادة
   * من آلية الحماية الخاصة به.
   *
   * @returns
   * - true إذا استجاب Redis بـ PONG.
   * - false إذا تعذر الوصول إلى Redis.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * يغلق اتصال Redis عند إنهاء التطبيق.
   *
   * يستدعى تلقائيًا بواسطة NestJS أثناء تدمير الـ Module
   * لتحرير موارد الاتصال بصورة سليمة.
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed.');
  }

  // ─────────────────────────────────────────────────────────────
  // Internal Helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * يسجل أحداث الـ Circuit Breaker لمراقبة حالة Redis.
   *
   * تستخدم هذه الأحداث لأغراض المراقبة (Observability)
   * ولا تؤثر على منطق تنفيذ العمليات.
   */
  private _setupBreakerEvents(): void {
    this.breaker.on('open', () =>
      this.logger.error(
        'Circuit OPEN: Redis is unavailable. Cache operations are being bypassed.',
      ),
    );

    this.breaker.on('halfOpen', () =>
      this.logger.warn('Circuit HALF_OPEN: Testing Redis availability.'),
    );

    this.breaker.on('close', () =>
      this.logger.log('Circuit CLOSED: Redis is available again.'),
    );
  }

  /**
   * يسجل أخطاء عمليات Redis بطريقة موحدة.
   *
   * يميز بين:
   * - فتح الـ Circuit Breaker.
   * - أخطاء Redis الفعلية.
   *
   * @param operation اسم العملية المنفذة.
   * @param target المفتاح أو الـ Pattern المرتبط بالعملية.
   * @param error الخطأ الناتج.
   */
  private _logError(operation: string, target: string, error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'EOPEN'
    ) {
      this.logger.warn(
        `[${operation}] Circuit OPEN. Skipping operation for "${target}".`,
      );
      return;
    }

    const message = error instanceof Error ? error.message : String(error);

    this.logger.error(`[${operation}] Failed for "${target}": ${message}`);
  }
}
