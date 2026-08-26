type VerificationCodeType = 'double-factor';

interface AccessTokenPayload {
  accountId: string;
  roleId: string;
  profileId: string;
}

export { VerificationCodeType, AccessTokenPayload };
