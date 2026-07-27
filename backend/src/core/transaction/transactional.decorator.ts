import { TransactionContext } from './transaction.context';

/**
 * @Transactional() — opens a Prisma interactive transaction around the decorated method.
 *
 * All repository calls inside the method automatically share the same transaction
 * via TransactionalPrismaService.
 *
 * Rules:
 * - The class must inject PrismaService as `this.prisma`.
 * - Nested @Transactional() calls reuse the active transaction instead of opening a new one.
 * - On success: Prisma commits automatically.
 * - On failure: Prisma rolls back automatically.
 *
 * @example
 * @Transactional()
 * async assignPlan(tenantId: string, planId: string): Promise<void> {
 *   await this.subscriptionRepo.create(data);
 *   await this.historyRepo.create(historyData);
 * }
 */
export function Transactional(): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Rule 1: If already inside a transaction, reuse it
      if (TransactionContext.getClient()) {
        return originalMethod.apply(this, args);
      }

      const prisma = (this as any).prisma;

      if (!prisma || typeof prisma.$transaction !== 'function') {
        throw new Error(
          `@Transactional() requires PrismaService to be injected as "prisma". ` +
            `Method: ${String(propertyKey)}`,
        );
      }

      return prisma.$transaction(async (tx: any) => {
        return TransactionContext.run(tx, () =>
          originalMethod.apply(this, args),
        );
      });
    };

    return descriptor;
  };
}
