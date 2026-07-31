import { Transactional } from './transactional.decorator';
import {
  TransactionContext,
  TransactionClient,
} from '../context/transaction.context';

describe('@Transactional()', () => {
  it('should throw a clear error when prisma is not injected', async () => {
    class TestService {
      @Transactional()
      async doWork() {
        return 'done';
      }
    }

    const service = new TestService();

    await expect(service.doWork()).rejects.toThrow(
      '@Transactional() requires PrismaService to be injected as "prisma"',
    );
  });

  it('should open a Prisma transaction and store the client in context', async () => {
    const mockTx = { subscription: {} } as unknown as TransactionClient;

    class TestService {
      prisma = {
        $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
      };

      @Transactional()
      async doWork() {
        return TransactionContext.getClient();
      }
    }

    const service = new TestService();
    const result = await service.doWork();

    expect(result).toBe(mockTx);
    expect(service.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should return the result of the original method', async () => {
    const mockTx = {} as unknown as TransactionClient;

    class TestService {
      prisma = {
        $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
      };

      @Transactional()
      async doWork() {
        return 'success';
      }
    }

    const service = new TestService();
    const result = await service.doWork();

    expect(result).toBe('success');
  });

  it('should rollback on failure (Prisma handles this automatically)', async () => {
    const mockTx = {} as unknown as TransactionClient;

    class TestService {
      prisma = {
        $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
      };

      @Transactional()
      async doWork() {
        throw new Error('business error');
      }
    }

    const service = new TestService();

    await expect(service.doWork()).rejects.toThrow('business error');
    expect(service.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should clear the context after the method completes', async () => {
    const mockTx = {} as unknown as TransactionClient;

    class TestService {
      prisma = {
        $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
      };

      @Transactional()
      async doWork() {
        return 'done';
      }
    }

    const service = new TestService();
    await service.doWork();

    expect(TransactionContext.getClient()).toBeUndefined();
  });

  it('should reuse the active transaction when nested', async () => {
    const mockTx = { id: 'outer-tx' } as unknown as TransactionClient;

    class InnerService {
      prisma = {
        $transaction: jest.fn(),
      };

      @Transactional()
      async innerWork() {
        return TransactionContext.getClient();
      }
    }

    class OuterService {
      prisma = {
        $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
      };

      constructor(private readonly inner: InnerService) {}

      @Transactional()
      async outerWork() {
        return this.inner.innerWork();
      }
    }

    const innerService = new InnerService();
    const outerService = new OuterService(innerService);

    const result = await outerService.outerWork();

    // The inner method should have received the same tx from the outer
    expect(result).toBe(mockTx);

    // The outer service opened a transaction
    expect(outerService.prisma.$transaction).toHaveBeenCalledTimes(1);

    // The inner service should NOT have opened its own transaction
    expect(innerService.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should pass method arguments correctly', async () => {
    const mockTx = {} as unknown as TransactionClient;

    class TestService {
      prisma = {
        $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
      };

      @Transactional()
      async doWork(a: string, b: number) {
        return `${a}-${b}`;
      }
    }

    const service = new TestService();
    const result = await service.doWork('hello', 42);

    expect(result).toBe('hello-42');
  });
});
