import { DataSource, EntityManager } from 'typeorm';

import { TransactionContext } from '../../../../domain/ports';

import { TypeOrmTransactionContext } from './typeorm-transaction-context.adapter';
import { TypeOrmTransactionManagerAdapter } from './typeorm-transaction-manager.adapter';

describe('TypeOrmTransactionManagerAdapter', () => {
  it('deberia ejecutar el callback dentro de una transaccion con su contexto', async () => {
    // Arrange
    const manager = {} as EntityManager;
    const dataSource = {
      transaction: jest.fn(
        async (callback: (manager: EntityManager) => Promise<string>) =>
          callback(manager),
      ),
    } as unknown as DataSource;
    const adapter = new TypeOrmTransactionManagerAdapter(dataSource);
    const callback = jest.fn((context: TransactionContext) => {
      expect(context).toBeInstanceOf(TypeOrmTransactionContext);
      expect((context as TypeOrmTransactionContext).manager).toBe(manager);
      return Promise.resolve('completed');
    });

    // Act
    const result = await adapter.run(callback);

    // Assert
    expect(result).toBe('completed');
    expect((dataSource.transaction as jest.Mock).mock.calls).toHaveLength(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
