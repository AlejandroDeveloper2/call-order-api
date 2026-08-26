import { UserStatusType } from '../../../users/domain/types';

export interface FindAccountsQueryCommand {
  limit?: number;
  offset?: number;
  status?: UserStatusType;
  fullname?: string;
  email?: string;
  phone?: string;
  roleId?: string;
}
