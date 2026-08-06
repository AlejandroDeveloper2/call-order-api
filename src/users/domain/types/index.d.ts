enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

interface UpdateUserInput {
  fullname?: string;
  avatar?: string;
  phone?: string;
}

export { UserStatus, UpdateUserInput };
