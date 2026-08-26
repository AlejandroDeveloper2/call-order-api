export class Account {
  constructor(
    private readonly accountId: string,
    private email: string,
    private passwordHash: string,
    private mustChangePassword: boolean,
    private failedAttempts: number,
    private readonly profileId: string,
    private lastLoginAt?: Date,
    private lockedUntil?: Date,
  ) {}

  static create(
    accountId: string,
    email: string,
    passwordHash: string,
    mustChangePassword: boolean,
    failedAttempts: number,
    profileId: string,
    lastLoginAt?: Date,
    lockedUntil?: Date,
  ): Account {
    return new Account(
      accountId,
      email,
      passwordHash,
      mustChangePassword,
      failedAttempts,
      profileId,
      lastLoginAt,
      lockedUntil,
    );
  }

  incrementFailedAttempts(): void {
    this.failedAttempts = this.failedAttempts + 1;
  }

  block(lockUntil: Date): void {
    this.lockedUntil = lockUntil;
  }

  resetBlock(): void {
    this.failedAttempts = 0;
    this.lockedUntil = undefined;
  }

  get getAccountId(): string {
    return this.accountId;
  }

  get getEmail(): string {
    return this.email;
  }

  get getPasswordHash(): string {
    return this.passwordHash;
  }

  get getMustChangePassword(): boolean {
    return this.mustChangePassword;
  }

  get getFailedAttempts(): number {
    return this.failedAttempts;
  }

  get getProfileId(): string {
    return this.profileId;
  }

  get getLastLoginAt(): Date | undefined {
    return this.lastLoginAt;
  }

  get getLockedUntil(): Date | undefined {
    return this.lockedUntil;
  }
}
