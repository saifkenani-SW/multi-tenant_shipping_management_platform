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

  /**
   * تخزين نتيجة الدالة في طبقة الـ Request Cache (AsyncLocalStorage).
   *
   * عند التفعيل، يتحقق الـ Decorator من وجود القيمة في ذاكرة الـ Request
   * قبل الوصول إلى Redis أو قاعدة البيانات.
   *
   * مفيد جداً عندما تُستدعى نفس الدالة أكثر من مرة
   * في نفس الـ HTTP Request (مثل جلب Policy ثم Service).
   *
   * يتم التجاهل هادئاً إذا لم يكن هناك سياق Request نشط
   * (بيئة اختبار، Background Jobs...).
   *
   * @default true
   */
  requestCache?: boolean;
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
