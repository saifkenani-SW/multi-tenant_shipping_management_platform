import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient } from '@prisma/client';

/**
 * The Prisma TransactionClient type.
 * Derived from the callback parameter of prisma.$transaction().
 */
export type TransactionClient = Parameters<
  Extract<Parameters<PrismaClient['$transaction']>[0], (...args: any) => any>
>[0];

const storage = new AsyncLocalStorage<TransactionClient>();

/**
 * Internal transaction context.
 *
 * This module is an implementation detail of the transaction infrastructure.
 * It must NEVER be imported outside src/core/transaction/.
 */
export const TransactionContext = {
  /**
   * Returns the active TransactionClient, or undefined if not inside a transaction.
   */
  getClient(): TransactionClient | undefined {
    return storage.getStore();
  },

  /**
   * Executes fn inside a new AsyncLocalStorage context with the given TransactionClient.
   */
  run<T>(client: TransactionClient, fn: () => Promise<T>): Promise<T> {
    return storage.run(client, fn);
  },
};
