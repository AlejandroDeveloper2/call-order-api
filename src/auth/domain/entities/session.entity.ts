import { Account } from './account.entity';

export class Session {
  constructor(
    public readonly sessionId: string,
    public readonly accountId: string,
    public tokenHash: string,
    public refreshTokenHash: string,
    public expiresAt: Date,
    public lastActivityAt: Date,
    public browser?: string,
    public operatingSystem?: string,
    public ipAddress?: string,
    public userAgent?: string,
    public revokedAt?: Date,
    public deviceName?: string,
    public deviceType?: string,
    public account?: Account,
  ) {}
}
