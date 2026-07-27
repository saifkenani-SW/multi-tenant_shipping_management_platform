import { AuthorizationContainer } from '../authorization.container';
import { CapabilitiesOptions } from '../contracts';
import { AuthorizationFacade } from '../facade/authorization.facade';

export function ReturnCapabilities<TEntity, TCapability>(
  options: CapabilitiesOptions<TEntity, TCapability>,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      if (result == null) {
        return result;
      }

      const executor = AuthorizationContainer.get(AuthorizationFacade);

      const capabilities = await executor.buildCapabilities(result, options);
      Object.assign(result, { capabilities });
      return result;
    };

    return descriptor;
  };
}
