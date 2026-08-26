import { UserStatusType } from '../../domain/types';

export interface UpdateUserStatusCommand {
  status: UserStatusType;
}
