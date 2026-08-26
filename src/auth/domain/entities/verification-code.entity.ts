import { VerificationCodeType } from '../types';

export class VerificationCode {
  constructor(
    private readonly verificationCodeId: string,
    private codeHash: string,
    private codeLookup: string,
    private type: VerificationCodeType,
    private expiresAt: Date,
    private attempts: number,
    private readonly accountId: string,
    private usedAt?: Date,
  ) {}

  static create(
    verificationCodeId: string,
    codeHash: string,
    codeLookup: string,
    type: VerificationCodeType,
    expiresAt: Date,
    attempts: number,
    accountId: string,
    usedAt?: Date,
  ): VerificationCode {
    return new VerificationCode(
      verificationCodeId,
      codeHash,
      codeLookup,
      type,
      expiresAt,
      attempts,
      accountId,
      usedAt,
    );
  }

  static generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  incrementAttempts(): void {
    this.attempts = this.attempts + 1;
  }

  get getVerificationCodeId(): string {
    return this.verificationCodeId;
  }

  get getCodeHash(): string {
    return this.codeHash;
  }

  get getCodeLookup(): string {
    return this.codeLookup;
  }

  get getType(): VerificationCodeType {
    return this.type;
  }

  get getExpiresAt(): Date {
    return this.expiresAt;
  }

  get getAttempts(): number {
    return this.attempts;
  }

  get getAccountId(): string {
    return this.accountId;
  }

  get getUsedAt(): Date | undefined {
    return this.usedAt;
  }
}
