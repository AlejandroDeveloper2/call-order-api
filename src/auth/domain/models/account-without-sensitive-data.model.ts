export interface AccountWithoutSensitiveDataModel {
  accountId: string;
  email: string;
  fullname: string;
  phone?: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}
