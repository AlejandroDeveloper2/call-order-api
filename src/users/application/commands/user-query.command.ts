import { UserStatusType } from '../../domain/types';

export interface UserQueryCommand {
  limit?: number;
  offset?: number;
  status?: UserStatusType;
  fullname?: string;
  email?: string;
  phone?: string;
  roleId?: string;
}
