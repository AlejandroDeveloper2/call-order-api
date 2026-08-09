import { Account } from './account.entity';

export class Session {
  constructor(
    public readonly sessionId: string,
    public readonly accountId: string,
    public refreshTokenHash: string,
    public browser: string,
    public operatingSystem: string,
    public ipAddress: string,
    public userAgent: string,
    public expiresAt: Date,
    public lastActivityAt: Date,
    public revokedAt?: Date,
    public deviceName?: string,
    public deviceType?: string,
    public account?: Account,
  ) {}
}
