type UserStatusType = 'active' | 'inactive';

interface UpdateUserInput {
  fullname?: string;
  phone?: string;
}

export { UserStatusType, UpdateUserInput };
