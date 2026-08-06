export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface ListUserQuery {
  status?: UserStatus;
  fullname?: string;
  email?: string;
  phone?: string;
  roleId?: string;
}

export interface UpdateUserInput {
  fullname?: string;
  avatar?: string;
  phone?: string;
}
