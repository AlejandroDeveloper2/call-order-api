export interface ValidateIdentityCommand {
  verificationCode: string;
  email: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  deviceType?: string;
}
