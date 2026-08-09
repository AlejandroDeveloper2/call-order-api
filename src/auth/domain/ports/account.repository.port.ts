import { Account } from '../entities';
import { UpdateAccountMetaInput } from '../types';

export abstract class AccountRepositoryPort {
  abstract findById(accountId: string): Promise<Account | null>;
  abstract create(account: Account): Promise<void>;
  abstract updateEmail(
    accountId: string,
    updatedEmail: string,
  ): Promise<number>;
  abstract updatePassword(
    accountId: string,
    updatedPassword: string,
  ): Promise<number>;

  abstract update(
    accountId: string,
    updateAccountMetaInput: UpdateAccountMetaInput,
  ): Promise<number>;
}

export const ACCOUNT_REPOSITORY = 'ACCOUNT_REPOSITORY';
