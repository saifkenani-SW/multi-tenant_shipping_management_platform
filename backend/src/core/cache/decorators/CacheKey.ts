import 'reflect-metadata';

export const CACHE_KEY_METADATA = 'cache:key_param';

/**
 * @CacheKey — يحدد الـ parameter المستخدم لبناء الـ cache key.
 *
 * مفيد لما تريد التحكم بالـ key بدون keyBuilder.
 *
 * @example
 * async findById(@CacheKey() id: string, tenantId: string) { ... }
 * // الـ key سيُبنى من id فقط
 */
export function CacheKey(): ParameterDecorator {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const existing: number[] =
      Reflect.getOwnMetadata(CACHE_KEY_METADATA, target, propertyKey!) ?? [];
    existing.push(parameterIndex);
    Reflect.defineMetadata(CACHE_KEY_METADATA, existing, target, propertyKey!);
  };
}

/**
 * Helper: يبني الـ key من الـ @CacheKey params فقط.
 * إذا لم يُحدد أي @CacheKey → يستخدم كل الـ args.
 */
export function buildKeyFromParams(
  target: any,
  propertyKey: string | symbol,
  args: any[],
  prefix: string,
): string {
  const keyParams: number[] =
    Reflect.getOwnMetadata(CACHE_KEY_METADATA, target, propertyKey) ?? [];

  if (keyParams.length === 0) {
    return `${prefix}:${args.map((a) => JSON.stringify(a)).join(':')}`;
  }

  return `${prefix}:${keyParams
    .sort((a, b) => a - b)
    .map((i) => JSON.stringify(args[i]))
    .join(':')}`;
}
