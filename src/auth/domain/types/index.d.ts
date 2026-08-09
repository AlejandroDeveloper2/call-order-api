type VerificationCodeType = 'double-factor';

interface UpdateAccountMetaInput {
  lastLoginAt?: Date;
  failedAttempts?: number;
  lockedUtil?: Date;
}

export { VerificationCodeType, UpdateAccountMetaInput };
