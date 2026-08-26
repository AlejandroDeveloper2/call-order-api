export interface AccountLoginModel {
  accountId: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil?: Date;
  profile: {
    isActive: boolean;
  };
}
