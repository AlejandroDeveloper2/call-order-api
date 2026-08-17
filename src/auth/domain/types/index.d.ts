type VerificationCodeType = 'double-factor';

interface UpdateAccountMetaInput {
  lastLoginAt?: Date;
  failedAttempts?: number;
  lockedUtil?: Date;
}

interface UpdateCodeMetaInput {
  attempts: number;
  codeHash: string;
  expiresAt: Date;
}

export { VerificationCodeType, UpdateAccountMetaInput, UpdateCodeMetaInput };
