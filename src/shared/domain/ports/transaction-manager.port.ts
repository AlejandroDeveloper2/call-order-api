import { TransactionContext } from './transaction-context.port';

export abstract class TransactionManagerPort {
  abstract run<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T>;
}
export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');
