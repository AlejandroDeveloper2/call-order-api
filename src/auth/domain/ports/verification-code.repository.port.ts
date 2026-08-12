import { VerificationCode } from '../entities';

export abstract class VerificationCodeRepositoryPort {
  abstract findByAccountId(accountId: string): Promise<VerificationCode[]>;
  abstract create(verificationCode: VerificationCode): Promise<void>;
  abstract updateCodeHash(
    verificationCodeId: string,
    attempts: number,
    codeHash: string,
  ): Promise<number>;
  abstract invalidateCode(
    verificationCodeId: string,
    usedAt: Date,
  ): Promise<number>;
}

export const VERIFICATION_CODE_REPOSITORY = 'VERIFICATION_CODE_REPOSITORY';
