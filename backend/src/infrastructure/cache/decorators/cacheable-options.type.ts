import { CacheStrategy } from './cache-strategy.enum';

type BaseCacheableOptions = {
  /**
   * مدة الاحتفاظ بالقيمة داخل الـ Cache بالثواني.
   */
  ttl?: number;

  /**
   * Prefix يستخدم عند بناء المفتاح إذا لم يتم توفير keyBuilder.
   */
  keyPrefix?: string;

  /**
   * يبني أجزاء مفتاح الـ Cache.
   *
   * يستخدم مع استراتيجية SINGLE فقط.
   */
  keyBuilder?: (...args: unknown[]) => readonly unknown[];
};

type SingleCacheOptions = {
  /**
   * استراتيجية تخزين عنصر واحد.
   */
  strategy?: CacheStrategy.SINGLE;

  ids?: never;
  loader?: never;
};

type ManyCacheOptions = {
  /**
   * استراتيجية تخزين عدة عناصر.
   */
  strategy: CacheStrategy.MANY;

  /**
   * استخراج معرفات العناصر من معاملات الدالة.
   */
  ids: (...args: unknown[]) => readonly string[];

  /**
   * إعادة بناء معاملات الدالة عند تنفيذ loader.
   *
   * تستقبل:
   * - args: معاملات الدالة الأصلية.
   * - missingIds: المعرفات غير الموجودة في الـ Cache.
   *
   * وتعيد معاملات جديدة تستدعى بها الدالة الأصلية.
   */
  loader: (
    args: readonly unknown[],
    missingIds: readonly string[],
  ) => readonly unknown[];

  keyBuilder?: never;
};

export type CacheableOptions =
  | (BaseCacheableOptions & SingleCacheOptions)
  | (BaseCacheableOptions & ManyCacheOptions);
