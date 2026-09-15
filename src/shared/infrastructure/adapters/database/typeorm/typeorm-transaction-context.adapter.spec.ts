import { EntityManager } from 'typeorm';

import { TypeOrmTransactionContext } from './typeorm-transaction-context.adapter';

describe('TypeOrmTransactionContext', () => {
  it('deberia conservar el EntityManager de la transaccion', () => {
    // Arrange
    const manager = {} as EntityManager;

    // Act
    const context = new TypeOrmTransactionContext(manager);

    // Assert
    expect(context.manager).toBe(manager);
  });
});
