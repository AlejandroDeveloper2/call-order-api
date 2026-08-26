export interface VerificationCodeValidationModel {
  verificationCodeId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  accountId: string;
  profile: {
    profileId: string;
    roleId: string;
  };
  usedAt?: Date;
}
