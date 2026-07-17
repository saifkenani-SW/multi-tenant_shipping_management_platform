import { TransactionalPrismaService } from './transactional-prisma.service';
import { TransactionContext, TransactionClient } from './transaction.context';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('TransactionalPrismaService', () => {
  let service: TransactionalPrismaService;
  let mockPrisma: PrismaService;

  beforeEach(() => {
    mockPrisma = {
      tenant: {},
      subscription_plan: {},
    } as unknown as PrismaService;

    service = new TransactionalPrismaService(mockPrisma);
  });

  it('should return PrismaService when no transaction is active', () => {
    expect(service.client).toBe(mockPrisma);
  });

  it('should return TransactionClient when inside a transaction', async () => {
    const mockTx = {
      tenant: {},
      subscription_plan: {},
    } as unknown as TransactionClient;

    await TransactionContext.run(mockTx, async () => {
      expect(service.client).toBe(mockTx);
    });
  });

  it('should return PrismaService after the transaction ends', async () => {
    const mockTx = {} as unknown as TransactionClient;

    await TransactionContext.run(mockTx, async () => {
      expect(service.client).toBe(mockTx);
    });

    // After the transaction context is cleared
    expect(service.client).toBe(mockPrisma);
  });
});
