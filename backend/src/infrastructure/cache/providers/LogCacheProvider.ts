import {
  CacheKeyEntry,
  ICacheProvider,
} from '../../../core/cache/interfaces/ICacheProvider';

/**
 * يمثل عملية واحدة سُجِّلت بواسطة LogCacheProvider.
 */
export interface CacheOperationLog {
  /** نوع العملية */
  op: 'GET' | 'GET_MANY' | 'SET' | 'SET_MANY' | 'DEL' | 'DEL_PATTERN' | 'REMEMBER' | 'REMEMBER_MANY';
  /** المفتاح المعني (غير موجود في SET_MANY وGET_MANY وREMEMBER_MANY) */
  key?: string;
  /** هل وُجدت القيمة في الـ Cache؟ (في عمليات القراءة فقط) */
  hit?: boolean;
  /** الوقت بالميلي ثانية */
  timestamp: number;
}

/**
 * مزود Cache يلتف حول مزود آخر ويسجّل جميع العمليات.
 *
 * يُستخدم فقط للاختبارات والـ Debugging.
 *
 * مثال:
 * ```ts
 * const log = new LogCacheProvider(new InMemoryCacheProvider());
 *
 * await log.remember('key', () => fetchFromDb(), 300);
 *
 * console.log(log.getLog());
 * // [{ op: 'REMEMBER', key: 'key', hit: false, timestamp: ... }]
 * ```
 */
export class LogCacheProvider implements ICacheProvider {
  private readonly log: CacheOperationLog[] = [];

  constructor(private readonly inner: ICacheProvider) {}

  async get<T>(key: string): Promise<T | null> {
    const result = await this.inner.get<T>(key);

    this.log.push({
      op: 'GET',
      key,
      hit: result !== null,
      timestamp: Date.now(),
    });

    return result;
  }

  async getMany<T>(keys: readonly string[]): Promise<Map<string, T>> {
    const result = await this.inner.getMany<T>(keys);

    this.log.push({
      op: 'GET_MANY',
      hit: result.size > 0,
      timestamp: Date.now(),
    });

    return result;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.inner.set(key, value, ttl);

    this.log.push({
      op: 'SET',
      key,
      timestamp: Date.now(),
    });
  }

  async setMany<T>(
    entries: ReadonlyArray<{
      readonly key: string;
      readonly value: T;
      readonly ttl?: number;
    }>,
  ): Promise<void> {
    await this.inner.setMany(entries);

    this.log.push({
      op: 'SET_MANY',
      timestamp: Date.now(),
    });
  }

  async del(key: string): Promise<void> {
    await this.inner.del(key);

    this.log.push({
      op: 'DEL',
      key,
      timestamp: Date.now(),
    });
  }

  async delByPattern(pattern: string): Promise<void> {
    await this.inner.delByPattern(pattern);

    this.log.push({
      op: 'DEL_PATTERN',
      key: pattern,
      timestamp: Date.now(),
    });
  }

  async remember<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const existing = await this.inner.get<T>(key);
    const hit = existing !== null;

    const result = hit ? existing! : await loader();

    if (!hit) {
      await this.inner.set(key, result, ttl);
    }

    this.log.push({
      op: 'REMEMBER',
      key,
      hit,
      timestamp: Date.now(),
    });

    return result;
  }

  async rememberMany<T extends { id: string }>(
    entries: ReadonlyArray<CacheKeyEntry>,
    loader: (missingIds: readonly string[]) => Promise<readonly T[]>,
    ttl?: number,
  ): Promise<Map<string, T>> {
    const result = await this.inner.rememberMany(entries, loader, ttl);

    this.log.push({
      op: 'REMEMBER_MANY',
      hit: result.size === entries.length,
      timestamp: Date.now(),
    });

    return result;
  }

  async isHealthy(): Promise<boolean> {
    return this.inner.isHealthy();
  }

  // ──────────────────────────────
  // Inspection API للاختبارات
  // ──────────────────────────────

  /**
   * يُرجع نسخة من سجل العمليات.
   */
  getLog(): CacheOperationLog[] {
    return [...this.log];
  }

  /**
   * يُرجع آخر عملية سُجِّلت.
   */
  getLastLog(): CacheOperationLog | undefined {
    return this.log[this.log.length - 1];
  }

  /**
   * يُرجع عدد العمليات من نوع معين.
   */
  countOp(op: CacheOperationLog['op']): number {
    return this.log.filter((entry) => entry.op === op).length;
  }

  /**
   * يُرجع عدد الـ Cache Hits من نوع عملية معين.
   */
  countHits(op: CacheOperationLog['op']): number {
    return this.log.filter((entry) => entry.op === op && entry.hit === true)
      .length;
  }

  /**
   * يُرجع عدد الـ Cache Misses من نوع عملية معين.
   */
  countMisses(op: CacheOperationLog['op']): number {
    return this.log.filter((entry) => entry.op === op && entry.hit === false)
      .length;
  }

  /**
   * يمسح سجل العمليات.
   *
   * مفيد بين اختبارات متتالية.
   */
  clearLog(): void {
    this.log.length = 0;
  }
}
