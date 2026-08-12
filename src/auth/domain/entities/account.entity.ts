import { User } from '../../../users/domain/entities';

export class Account {
  constructor(
    public readonly accountId: string,
    public email: string,
    public passwordHash: string,
    public mustChangePassword: boolean,
    public failedAttempts: number,
    public lastLoginAt?: Date,
    public lockedUtil?: Date,
    public profile?: User,
  ) {}
}
