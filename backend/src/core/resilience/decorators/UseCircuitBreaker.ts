import { Logger } from '@nestjs/common';
import CircuitBreaker, { Options } from 'opossum';

// سجل لحفظ القواطع ومشاركتها عبر التطبيق بأكمله
const breakerRegistry = new Map<string, CircuitBreaker<any[], any>>();
const logger = new Logger('CircuitBreakerDecorator');

export interface CircuitBreakerDecoratorOptions extends Options {
  /** اسم القاطع لضمان مشاركته بين الدوال التي تتصل بنفس الخدمة */
  name: string;
}

/**
 * @UseCircuitBreaker — يلف الدالة بقاطع تيار ذكي.
 * إذا كان القاطع بنفس الاسم موجوداً، سيتم إعادة استخدامه.
 */
export function UseCircuitBreaker(
  options: CircuitBreakerDecoratorOptions,
): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const breakerName = options.name;

    // 1. إذا لم يكن القاطع موجوداً في السجل، قم بإنشائه مرة واحدة فقط
    if (!breakerRegistry.has(breakerName)) {
      const breaker = new CircuitBreaker<any[], any>(
        // دالة مجهولة مهمتها تنفيذ الدالة الأصلية مع الحفاظ على الـ Context (this)
        async (ctx: any, args: any[]) => await originalMethod.apply(ctx, args),
        options,
      );

      // تسجيل الأحداث للمراقبة (Observability)
      breaker.on('open', () =>
        logger.error(`🔴 [${breakerName}] Circuit OPEN`),
      );
      breaker.on('halfOpen', () =>
        logger.warn(`🟡 [${breakerName}] Circuit HALF_OPEN`),
      );
      breaker.on('close', () =>
        logger.log(`🟢 [${breakerName}] Circuit CLOSED`),
      );

      breakerRegistry.set(breakerName, breaker);
    }

    // 2. استبدال الدالة الأصلية بدالة تمر عبر القاطع
    descriptor.value = async function (...args: any[]) {
      const breaker = breakerRegistry.get(breakerName)!;

      try {
        // نمرر الـ Context الحالي (this) والوسائط للقاطع
        return await breaker.fire(this, args);
      } catch (error: any) {
        if (error.code === 'EOPEN') {
          throw new Error(
            `Service [${breakerName}] is currently unavailable (Circuit Open)`,
          );
        }
        throw error;
      }
    };

    return descriptor;
  };
}
