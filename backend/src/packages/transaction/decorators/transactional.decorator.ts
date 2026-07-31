import { TransactionContext } from '../context/transaction.context';
import { TransactionContainer } from '../container/transaction.container';
import { TransactionFacade } from '../facade/transaction.facade';

/**
 * @Transactional() — opens an interactive transaction around the decorated method.
 *
 * All repository calls inside the method automatically share the same transaction
 * via TransactionalPrismaService.
 *
 * Rules:
 * - Nested @Transactional() calls reuse the active transaction instead of opening a new one.
 * - On success: commits automatically.
 * - On failure: rolls back automatically.
 */
export function Transactional(): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Rule 1: If already inside a transaction, reuse it
      if (TransactionContext.getClient()) {
        return originalMethod.apply(this, args);
      }

      // Resolve the facade from the container instead of requiring this.prisma
      const facade = TransactionContainer.get(TransactionFacade);

      return facade.execute(async (tx: any) => {
        return TransactionContext.run(tx, () =>
          originalMethod.apply(this, args),
        );
      });
    };

    return descriptor;
  };
}
