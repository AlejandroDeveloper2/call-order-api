import { HttpStatus } from '@nestjs/common';

/** Códigos de error HTTP a nivel de infraestructura */
export const EXCEPTION_HTTP_STATUS: Record<string, number> = {
  // Códigos de autenticación
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,

  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,

  ACCOUNT_LOCKED: HttpStatus.FORBIDDEN,

  VERIFICATION_CODE_EXPIRED: HttpStatus.UNAUTHORIZED,

  INVALID_VERIFICATION_CODE: HttpStatus.UNAUTHORIZED,

  INVALID_TOKEN: HttpStatus.UNAUTHORIZED,

  MISSING_TOKEN: HttpStatus.BAD_REQUEST,

  EXPIRED_TOKEN: HttpStatus.UNAUTHORIZED,

  INVALID_SESSION: HttpStatus.UNAUTHORIZED,

  INACTIVE_ACCOUNT: HttpStatus.FORBIDDEN,
};
