import { VerificationCodeType } from '../types';

export class VerificationCode {
  constructor(
    public readonly verificationCodeId: string,
    public readonly accountId: string,
    public codeHash: string,
    public type: VerificationCodeType,
    public expiresAt: Date,
    public attempts: number,
    public usedAt?: Date,
  ) {}
}
