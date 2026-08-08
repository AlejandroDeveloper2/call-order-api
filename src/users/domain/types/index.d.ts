type UserStatusType = 'active' | 'inactive';

interface UpdateUserInput {
  avatar?: string;
  fullname?: string;
  phone?: string;
}

export { UserStatusType, UpdateUserInput };
