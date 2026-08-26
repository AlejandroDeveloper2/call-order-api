/** Puertos */
import { TransactionContext } from '../../../shared/domain/ports';

/** Entidades */
import { Account } from '../entities';

/** Modelos de lectura*/
import {
  AccountIdentityValidationModel,
  AccountLoginModel,
  AccountPasswordUpdatingModel,
  AccountTokenValidationModel,
} from '../models';

export abstract class AccountRepositoryPort {
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
