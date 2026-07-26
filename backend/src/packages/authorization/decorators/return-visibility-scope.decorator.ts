import { AuthorizationContainer } from '../authorization.container';
import {
  AuthorizationFacade,
  ScopeOptions,
} from '../index';

export function ReturnVisibilityScope<TScope>(
  options: ScopeOptions<TScope>,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      if (result == null) {
        return result;
      }

      const executor = AuthorizationContainer.get(AuthorizationFacade);

      const scope = executor.buildScope(options);

      if (typeof result === 'object') {
        if ('meta' in result && typeof result.meta === 'object') {
          Object.assign(result.meta, { scope });
        } else {
          Object.assign(result, { scope });
        }
      }

      return result;
    };

    return descriptor;
  };
}
