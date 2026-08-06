type UserStatusType = 'active' | 'inactive';

interface UpdateUserInput {
  fullname?: string;
  avatar?: string;
  phone?: string;
}

export { UserStatusType, UpdateUserInput };
