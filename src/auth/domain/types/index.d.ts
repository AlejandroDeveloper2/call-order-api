type VerificationCodeType = 'double-factor';

interface UpdateAccountMetaInput {
  lastLoginAt?: Date;
  failedAttempts?: number;
  lockedUtil?: Date;
  email?: string;
  passwordHash?: string;
}

interface UpdateCodeInput {
  attempts?: number;
  codeHash?: string;
  expiresAt?: Date;
  usedAt?: Date;
}

interface UpdateSessionInput {
  refreshTokenHash?: string;
  tokenHash?: string;
  revokedAt?: Date;
  expiresAt?: Date;
  lastActivityAt?: Date;
}

export {
  VerificationCodeType,
  UpdateAccountMetaInput,
  UpdateCodeMetaInput,
  UpdateSessionInput,
  UpdateCodeInput,
};
