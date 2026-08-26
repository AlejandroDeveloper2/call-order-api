export class Session {
  constructor(
    private readonly sessionId: string,
    private tokenHash: string,
    private refreshTokenHash: string,
    private expiresAt: Date,
    private lastActivityAt: Date,
    private readonly accountId: string,
    private browser?: string,
    private operatingSystem?: string,
    private ipAddress?: string,
    private userAgent?: string,
    private revokedAt?: Date,
    private deviceName?: string,
    private deviceType?: string,
  ) {}

  static create(
    sessionId: string,
    tokenHash: string,
    refreshTokenHash: string,
    expiresAt: Date,
    lastActivityAt: Date,
    accountId: string,
    browser?: string,
    operatingSystem?: string,
    ipAddress?: string,
    userAgent?: string,
    revokedAt?: Date,
    deviceName?: string,
    deviceType?: string,
  ): Session {
    return new Session(
      sessionId,
      tokenHash,
      refreshTokenHash,
      expiresAt,
      lastActivityAt,
      accountId,
      browser,
      operatingSystem,
      ipAddress,
      userAgent,
      revokedAt,
      deviceName,
      deviceType,
    );
  }

  get getSessionId(): string {
    return this.sessionId;
  }

  get getTokenHash(): string {
    return this.tokenHash;
  }

  get getRefreshTokenHash(): string {
    return this.refreshTokenHash;
  }

  get getExpiresAt(): Date {
    return this.expiresAt;
  }

  get getLastActivityAt(): Date {
    return this.lastActivityAt;
  }

  get getAccountId(): string {
    return this.accountId;
  }

  get getBrowser(): string | undefined {
    return this.browser;
  }

  get getOperatingSystem(): string | undefined {
    return this.operatingSystem;
  }

  get getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  get getUserAgent(): string | undefined {
    return this.userAgent;
  }

  get getRevokedAt(): Date | undefined {
    return this.revokedAt;
  }

  get getDeviceName(): string | undefined {
    return this.deviceName;
  }

  get getDeviceType(): string | undefined {
    return this.deviceType;
  }
}
