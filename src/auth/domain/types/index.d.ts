import { UserStatusType } from '../../../users/domain/types';

type VerificationCodeType = 'double-factor';

interface AccessTokenPayload {
  accountId: string;
  roleId: string;
  profileId: string;
}

interface FindAccountsQuery {
  limit?: number;
  offset?: number;
  status?: UserStatusType;
  fullname?: string;
  email?: string;
  phone?: string;
  roleId?: string;
}

export { VerificationCodeType, AccessTokenPayload, FindAccountsQuery };
