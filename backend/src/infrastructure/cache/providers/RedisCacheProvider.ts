import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import CircuitBreaker from 'opossum';
import { ICacheProvider } from 'src/core/cache/interfaces/ICacheProvider';

export interface RedisCacheProviderOptions {
  /** خيارات مكتبة Opossum */
  circuitBreaker?: CircuitBreaker.Options;

  /** عدد الـ keys في كل batch عند SCAN — default 100 */
  scanCount?: number;
}

@Injectable()
export class RedisCacheProvider implements ICacheProvider, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheProvider.name);

  // تعريف نوع الـ Breaker ليقبل دالة لا متزامنة (Async Function)
  private readonly breaker: CircuitBreaker<[() => Promise<any>], any>;
  private readonly scanCount: number;

  constructor(
    private readonly redis: Redis,
    options: RedisCacheProviderOptions = {},
  ) {
    this.scanCount = options.scanCount ?? 100;

    // إعدادات Opossum الافتراضية للأنظمة الضخمة
    const breakerOptions: CircuitBreaker.Options = {
      timeout: 3000, // أقصى وقت لانتظار الـ Redis قبل اعتباره فاشلاً (3 ثوانٍ)
      errorThresholdPercentage: 50, // نسبة الطلبات الفاشلة المطلوبة لفتح الدائرة (50%)
      resetTimeout: 30_000, // وقت الانتظار قبل الانتقال لحالة HALF_OPEN (30 ثانية)
      volumeThreshold: 10, // الحد الأدنى من الطلبات قبل حساب نسبة الفشل
      ...options.circuitBreaker,
    };

    // تغليف دالة عامة لتنفيذ أي أمر Redis نمرره لها
    // تمرير الأنواع <[() => Promise<any>], any> صراحةً للـ constructor
    this.breaker = new CircuitBreaker<[() => Promise<any>], any>(
      async (action: () => Promise<any>) => await action(),
      breakerOptions,
    );

    this._setupBreakerEvents();
  }

  // ─── ICacheProvider ────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    try {
      // نستخدم breaker.fire بدلاً من execute
      const val = await this.breaker.fire(() => this.redis.get(key));
      return val ? (JSON.parse(val) as T) : null;
    } catch (err: any) {
      this._logError('GET', key, err);
      return null; // Fail-Safe: العودة لطبقة الـ Decorator لجلب البيانات من الـ DB
    }
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    try {
      await this.breaker.fire(() =>
        this.redis.set(key, JSON.stringify(value), 'EX', ttl),
      );
    } catch (err: any) {
      this._logError('SET', key, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.breaker.fire(() => this.redis.del(key));
    } catch (err: any) {
      this._logError('DEL', key, err);
    }
  }

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

        if (keysToDelete.length === 0) return;

        const pipeline = this.redis.pipeline();
        for (const key of keysToDelete) {
          pipeline.del(key);
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

  async isHealthy(): Promise<boolean> {
    try {
      // التحقق من صحة الاتصال لا يحتاج للمرور بالـ Circuit Breaker
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  // ─── Lifecycle ─────────────────────────────────────────────

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * تسجيل الأحداث لمراقبة صحة النظام (Observability)
   * مفيد جداً للربط مع أدوات المراقبة مثل Datadog أو Prometheus
   */
  private _setupBreakerEvents(): void {
    this.breaker.on('open', () =>
      this.logger.error(
        '🔴 Circuit OPEN: Redis is failing. Bypassing cache...',
      ),
    );
    this.breaker.on('halfOpen', () =>
      this.logger.warn('🟡 Circuit HALF_OPEN: Testing Redis recovery...'),
    );
    this.breaker.on('close', () =>
      this.logger.log('🟢 Circuit CLOSED: Redis connection fully recovered.'),
    );
  }

  private _logError(operation: string, key: string, err: any): void {
    // EOPEN هو الكود الافتراضي الذي ترميه Opossum عندما تكون الدائرة مفتوحة
    if (err.code === 'EOPEN') {
      this.logger.warn(
        `[${operation}] Circuit is OPEN — skipping operation for key/pattern="${key}"`,
      );
    } else {
      this.logger.error(
        `[${operation}] key/pattern="${key}" error: ${err?.message}`,
      );
    }
  }
}
