import { EntityManager } from 'typeorm';

import { TransactionContext } from '../../../../domain/ports';

export class TypeOrmTransactionContext implements TransactionContext {
  constructor(public readonly manager: EntityManager) {}
}
