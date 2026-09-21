import { DataSource, EntityManager } from 'typeorm';

import { TransactionContext } from '../../../../domain/ports';

import { TypeOrmTransactionContext } from './typeorm-transaction-context.adapter';
import { TypeOrmTransactionManagerAdapter } from './typeorm-transaction-manager.adapter';

type DataSourceMock = Pick<DataSource, 'transaction'>;

describe('TypeOrmTransactionManagerAdapter', () => {
  const manager = {} as EntityManager;
  let dataSourceMock: jest.Mocked<DataSourceMock>;
  let callbackMock: jest.Mock<Promise<string>, [context: object], any>;

  beforeEach(() => {
    dataSourceMock = {
      transaction: jest.fn(
        async (
          callback: (manager: EntityManager) => Promise<string>,
        ): Promise<string> => {
          return callback(manager);
        },
      ),
    } as unknown as jest.Mocked<DataSourceMock>;

    callbackMock = jest.fn((context: TransactionContext) => {
      expect(context).toBeInstanceOf(TypeOrmTransactionContext);
      expect((context as TypeOrmTransactionContext).manager).toBe(manager);
      return Promise.resolve('completed');
    });

    jest.clearAllMocks();
  });

  it('deberia ejecutar el callback dentro de una transaccion con su contexto', async () => {
    // Arrange
    const adapter = new TypeOrmTransactionManagerAdapter(
      dataSourceMock as unknown as DataSource,
    );

    // Act
    const result = await adapter.run(callbackMock);

    // Assert
    expect(result).toBe('completed');
    expect(dataSourceMock.transaction.mock.calls).toHaveLength(1);
    expect(callbackMock).toHaveBeenCalledTimes(1);
  });
});
