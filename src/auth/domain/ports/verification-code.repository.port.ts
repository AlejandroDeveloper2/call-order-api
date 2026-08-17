import { VerificationCode } from '../entities';
import { UpdateCodeMetaInput } from '../types';

export abstract class VerificationCodeRepositoryPort {
  abstract findByAccountId(accountId: string): Promise<VerificationCode[]>;
  abstract create(verificationCode: VerificationCode): Promise<void>;
  abstract updateCodeHash(
    verificationCodeId: string,
    updateCodeMetaInput: UpdateCodeMetaInput,
  ): Promise<number>;
  abstract invalidateCode(
    verificationCodeId: string,
    usedAt: Date,
  ): Promise<number>;
}

export const VERIFICATION_CODE_REPOSITORY = 'VERIFICATION_CODE_REPOSITORY';
