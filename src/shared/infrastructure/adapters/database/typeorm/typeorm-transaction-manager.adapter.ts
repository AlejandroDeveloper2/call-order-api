import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  TransactionContext,
  TransactionManagerPort,
} from '../../../../domain/ports';

import { TypeOrmTransactionContext } from './typeorm-transaction-context.adapter';

@Injectable()
export class TypeOrmTransactionManagerAdapter implements TransactionManagerPort {
  constructor(private readonly dataSource: DataSource) {}

  async run<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const context = new TypeOrmTransactionContext(manager);

      return callback(context);
    });
  }
}
