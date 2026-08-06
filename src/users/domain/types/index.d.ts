enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

interface ListUserQuery {
  status?: UserStatus;
  fullname?: string;
  email?: string;
  phone?: string;
  roleId?: string;
}

interface UpdateUserInput {
  fullname?: string;
  avatar?: string;
  phone?: string;
}
export { UserStatus, ListUserQuery, UpdateUserInput };
