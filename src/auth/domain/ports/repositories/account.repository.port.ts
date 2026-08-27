/** Puertos */
import { TransactionContext } from '../../../../shared/domain/ports';

/** Entidades */
import { Account } from '../../entities';

/** Modelos de lectura*/
import {
  AccountIdentityValidationModel,
  AccountLoginModel,
  AccountPasswordUpdatingModel,
  AccountTokenValidationModel,
  AccountWithoutSensitiveDataModel,
} from '../../models';

/** Tipos */
import { FindAccountsQuery } from '../../types';
import { PaginatedResponse } from '../../../../shared/domain/types';

export abstract class AccountRepositoryPort {
  abstract find(
    query: FindAccountsQuery,
  ): Promise<PaginatedResponse<AccountWithoutSensitiveDataModel>>;
  abstract findForLoginByEmail(
    email: string,
  ): Promise<AccountLoginModel | null>;

  abstract verifyByEmail(email: string): Promise<boolean>;

  abstract findForIdentityValidation(
    email: string,
  ): Promise<AccountIdentityValidationModel | null>;

  abstract findForUpdatingPassword(
    accountId: string,
  ): Promise<AccountPasswordUpdatingModel | null>;

  abstract findForTokenValidation(
    accountId: string,
  ): Promise<AccountTokenValidationModel | null>;

  abstract create(
    account: Account,
    context?: TransactionContext,
  ): Promise<void>;

  abstract updateLastLogin(
    accountId: string,
    lastLoginAt: Date,
    context?: TransactionContext,
  ): Promise<number>;

  abstract block(
    accountId: string,
    lockedUntil: Date,
    failedAttempts: number,
  ): Promise<number>;

  abstract unlock(accountId: string): Promise<number>;

  abstract updatePassword(
    accountId: string,
    updatedPasswordHash: string,
  ): Promise<number>;

  abstract updateEmail(
    accountId: string,
    updatedEmail: string,
  ): Promise<number>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
