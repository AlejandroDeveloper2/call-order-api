import { VerificationCode } from '../entities';

export abstract class VerificationCodeRepositoryPort {
  abstract findByCode(code: string): Promise<VerificationCode | null>;
  abstract create(verificationCode: VerificationCode): Promise<void>;
  abstract updateCodeHash(
    verificationCodeId: string,
    attempts: number,
    codeHash: string,
  ): Promise<number>;
  abstract invalidateCode(
    verificationCodeId: string,
    usedAt: string,
  ): Promise<number>;
}
