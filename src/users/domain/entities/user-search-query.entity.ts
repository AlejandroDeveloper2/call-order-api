import type { UserStatusType } from '../types';

export class UserSearchQuery {
  constructor(
    public limit?: number,
    public offset?: number,
    public status?: UserStatusType,
    public fullname?: string,
    public email?: string,
    public phone?: string,
    public roleId?: string,
  ) {}
}
