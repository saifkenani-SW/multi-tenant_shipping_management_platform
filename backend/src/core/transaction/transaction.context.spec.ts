import { TransactionContext, TransactionClient } from './transaction.context';

describe('TransactionContext', () => {
  it('should return undefined when no transaction is active', () => {
    expect(TransactionContext.getClient()).toBeUndefined();
  });

  it('should return the TransactionClient inside run()', async () => {
    const mockTx = { tenant: {} } as unknown as TransactionClient;

    await TransactionContext.run(mockTx, async () => {
      expect(TransactionContext.getClient()).toBe(mockTx);
    });
  });

  it('should clear the context after run() completes', async () => {
    const mockTx = { tenant: {} } as unknown as TransactionClient;

    await TransactionContext.run(mockTx, async () => {
      // inside — should be set
      expect(TransactionContext.getClient()).toBe(mockTx);
    });

    // outside — should be cleared
    expect(TransactionContext.getClient()).toBeUndefined();
  });

  it('should clear the context after run() throws', async () => {
    const mockTx = { tenant: {} } as unknown as TransactionClient;

    await expect(
      TransactionContext.run(mockTx, async () => {
        throw new Error('test error');
      }),
    ).rejects.toThrow('test error');

    expect(TransactionContext.getClient()).toBeUndefined();
  });

  it('should isolate contexts across concurrent runs', async () => {
    const tx1 = { id: 'tx1' } as unknown as TransactionClient;
    const tx2 = { id: 'tx2' } as unknown as TransactionClient;

    const results: string[] = [];

    await Promise.all([
      TransactionContext.run(tx1, async () => {
        await new Promise((r) => setTimeout(r, 10));
        const client = TransactionContext.getClient() as any;
        results.push(client.id);
      }),
      TransactionContext.run(tx2, async () => {
        const client = TransactionContext.getClient() as any;
        results.push(client.id);
      }),
    ]);

    expect(results).toContain('tx1');
    expect(results).toContain('tx2');
  });
});
