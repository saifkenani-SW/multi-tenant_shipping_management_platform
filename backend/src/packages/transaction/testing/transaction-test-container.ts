import { INestApplicationContext } from '@nestjs/common';
import { TransactionContainer } from '../container/transaction.container';

/**
 * Test-only helper for unit-testing services whose methods carry @Transactional().
 *
 * In the running application TransactionContainer is initialised at bootstrap and
 * resolves a TransactionFacade that opens a real Prisma transaction. A unit test
 * builds its service with mocked repositories and never boots Nest, so the
 * decorator would otherwise fail resolving that facade.
 *
 * This installs a container whose facade runs the wrapped function directly,
 * handing it a stub transaction client. The decorator's real code path still
 * executes — only the database boundary is replaced.
 */
export function installTransactionTestContainer(): void {
  const facade = {
    execute: <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn({}),
  };

  TransactionContainer.setApp({
    get: () => facade,
  } as unknown as INestApplicationContext);
}
