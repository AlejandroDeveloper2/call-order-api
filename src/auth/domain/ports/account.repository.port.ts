import { TransactionContext } from '../../../shared/domain/ports';

import { Account } from '../entities';
import { UpdateAccountMetaInput } from '../types';

export abstract class AccountRepositoryPort {
  abstract findById(accountId: string): Promise<Account | null>;
  abstract findByEmail(email: string): Promise<Account | null>;
  abstract create(
    account: Account,
    context?: TransactionContext,
  ): Promise<void>;
  abstract update(
    accountId: string,
    updateAccountMetaInput: UpdateAccountMetaInput,
    context?: TransactionContext,
  ): Promise<number>;
}

export const ACCOUNT_REPOSITORY = 'ACCOUNT_REPOSITORY';
