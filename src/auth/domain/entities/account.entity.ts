export class Account {
  constructor(
    public readonly accountId: string,
    public email: string,
    public passwordHash: string,
    public mustChangePassword: boolean,
    public lastLoginAt: Date,
    public failedAttempts: number,
    public lockedUtil?: Date,
  ) {}
}
