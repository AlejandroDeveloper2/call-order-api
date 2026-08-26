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

  static create(
    limit?: number,
    offset?: number,
    status?: UserStatusType,
    fullname?: string,
    email?: string,
    phone?: string,
    roleId?: string,
  ): UserSearchQuery {
    return new UserSearchQuery(
      limit,
      offset,
      status,
      fullname,
      email,
      phone,
      roleId,
    );
  }

  get getLimit(): number | undefined {
    return this.limit;
  }

  get getOffset(): number | undefined {
    return this.offset;
  }

  get getStatus(): UserStatusType | undefined {
    return this.status;
  }

  get getFullname(): string | undefined {
    return this.getFullname;
  }

  get getEmail(): string | undefined {
    return this.email;
  }

  get getPhone(): string | undefined {
    return this.phone;
  }

  get getRoleId(): string | undefined {
    return this.roleId;
  }
}
