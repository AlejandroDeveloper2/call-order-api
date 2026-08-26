export interface CreateAccountCommand {
  fullname: string;
  phone?: string;
  email: string;
  password: string;
  roleId: string;
}
