export interface AccountIdentityValidationModel {
  accountId: string;
  profile: {
    userId: string;
    roleId: string;
    isActive: boolean;
  };
}
