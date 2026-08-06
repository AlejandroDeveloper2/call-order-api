import { UserStatus } from '../types';

export class UserSearchQuery {
  constructor(
    public limit?: number,
    public offset?: number,
    public status?: UserStatus,
    public fullname?: string,
    public email?: string,
    public phone?: string,
    public roleId?: string,
  ) {}
}
