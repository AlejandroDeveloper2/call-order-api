import { TransactionContext } from './transaction-context.port';

export interface TransactionManagerPort {
  run<T>(callback: (context: TransactionContext) => Promise<T>): Promise<T>;
}
export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');
