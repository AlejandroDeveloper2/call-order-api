import { TransactionContext } from '../../../shared/domain/ports';
import { VerificationCode } from '../entities';
import { UpdateCodeInput } from '../types';

export abstract class VerificationCodeRepositoryPort {
  abstract findByAccountId(accountId: string): Promise<VerificationCode[]>;
  abstract create(verificationCode: VerificationCode): Promise<void>;
  abstract update(
    verificationCodeId: string,
    updateCodeInput: UpdateCodeInput,
    context?: TransactionContext,
  ): Promise<number>;
}

export const VERIFICATION_CODE_REPOSITORY = 'VERIFICATION_CODE_REPOSITORY';
