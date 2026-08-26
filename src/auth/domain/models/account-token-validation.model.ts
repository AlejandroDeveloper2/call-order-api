export interface AccountTokenValidationModel {
  accountId: string;
  lockedUntil?: Date;
  profile: {
    profileId: string;
    isActive: boolean;
    roleId: string;
  };
}
