import { AsyncContextProvider } from '../../../packages/context/providers/async-context.provider';
import { CacheContainer } from '../container/CacheContainer';

/**
 * طبقة كاش مرتبطة بعمر الـ Request الواحد.
 *
 * تعتمد على AsyncContextProvider الموجود في ContextModule
 * عبر CacheContainer، وتخزن البيانات داخل RequestContext.cache.
 *
 * السلوك عند غياب السياق (خارج HTTP أو قبل تهيئة CacheContainer):
 * - get: يُرجع undefined هادئاً.
 * - set: لا يفعل شيئاً هادئاً.
 *
 * هذا يضمن أن الـ @Cacheable decorator لا ينكسر في:
 * - بيئة الاختبار.
 * - Background jobs.
 * - أي سياق بدون HTTP Request.
 */
export class RequestCacheStore {
  /**
   * يجلب قيمة من كاش الـ Request الحالي.
   *
   * @returns القيمة إذا وُجدت، أو undefined في حال Cache Miss أو غياب السياق.
   */
  static get<T>(key: string): T | undefined {
    const context = RequestCacheStore.getContext();

    return context?.cache?.get(key) as T | undefined;
  }

  /**
   * يخزن قيمة في كاش الـ Request الحالي.
   *
   * يُهيِّئ الـ Map lazily عند أول استخدام.
   */
  static set<T>(key: string, value: T): void {
    const context = RequestCacheStore.getContext();

    if (!context) {
      return;
    }

    if (!context.cache) {
      context.cache = new Map();
    }

    context.cache.set(key, value);
  }

  /**
   * يحذف مفتاحاً واحداً من كاش الـ Request.
   */
  static delete(key: string): void {
    const context = RequestCacheStore.getContext();

    context?.cache?.delete(key);
  }

  /**
   * يُرجع حجم الـ Request Cache الحالي.
   *
   * مفيد للاختبارات والـ Debugging.
   */
  static size(): number {
    return RequestCacheStore.getContext()?.cache?.size ?? 0;
  }

  /**
   * يتحقق من وجود سياق Request نشط.
   */
  static hasContext(): boolean {
    return RequestCacheStore.getContext() !== undefined;
  }

  private static getContext() {
    try {
      const provider =
        CacheContainer.get<AsyncContextProvider>(AsyncContextProvider);

      return provider.get();
    } catch {
      // CacheContainer غير مهيأ (بيئة اختبار / خارج NestJS)
      return undefined;
    }
  }
}
