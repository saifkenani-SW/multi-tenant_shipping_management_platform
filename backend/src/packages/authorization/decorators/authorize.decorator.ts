import { AuthorizeOptions } from '../contracts';
import { AuthorizationContainer } from '../authorization.container';
import { AuthorizationFacade } from '../facade/authorization.facade';
export function Authorize<TPayload = unknown>(
  options: AuthorizeOptions<TPayload>,
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const executor = AuthorizationContainer.get(AuthorizationFacade);

      const payload = options.payloadResolver?.(...args);

      await executor.authorize(options, payload);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
