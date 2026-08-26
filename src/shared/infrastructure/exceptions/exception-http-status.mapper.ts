import { HttpStatus } from '@nestjs/common';

/** Códigos de error HTTP a nivel de infraestructura */
export const EXCEPTION_HTTP_STATUS: Record<string, number> = {
  // Códigos de error generales Infraestructura
  EMAIL_SENDING_ERROR: HttpStatus.FAILED_DEPENDENCY,
  FILE_NOT_PROVIDED: HttpStatus.BAD_REQUEST,
  FILE_UPLOAD_ERROR: HttpStatus.FAILED_DEPENDENCY,
  PERSISTENCE_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,

  // Códigos de error módulo autenticación dominio
  INVALID_CODE_FORMAT: HttpStatus.BAD_REQUEST,
  INVALID_EMAIL: HttpStatus.BAD_REQUEST,
  INVALID_PASSWORD: HttpStatus.BAD_REQUEST,
  INVALID_REFRESH_TOKEN: HttpStatus.BAD_REQUEST,
  INVALID_TOKEN: HttpStatus.BAD_REQUEST,

  // Códigos de error módulo autenticación aplicación
  ACCOUNT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  ACCOUNT_LOCKED: HttpStatus.FORBIDDEN,
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,
  CODE_NOT_EXPIRED_YET: HttpStatus.BAD_REQUEST,
  EXPIRED_CODE: HttpStatus.UNAUTHORIZED,
  INACTIVE_ACCOUNT: HttpStatus.FORBIDDEN,
  INCORRECT_PASSWORD: HttpStatus.UNAUTHORIZED,
  INVALID_CODE: HttpStatus.UNAUTHORIZED,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  INVALID_SESSION: HttpStatus.UNAUTHORIZED,

  // Códigos de error módulo autenticación infra
  EXPIRED_TOKEN: HttpStatus.UNAUTHORIZED,
  INSUFFICIENT_PERMISSIONS: HttpStatus.FORBIDDEN,
  MALFORMED_TOKEN: HttpStatus.BAD_REQUEST,
  MISSING_REFRESH_TOKEN: HttpStatus.UNAUTHORIZED,
  MISSING_TOKEN: HttpStatus.UNAUTHORIZED,
  NOT_AUTHENTICATED: HttpStatus.UNAUTHORIZED,

  // Códigos de error módulo usuarios dominio
  INVALID_FULLNAME_FORMAT: HttpStatus.BAD_REQUEST,
  INVALID_PHONE_FORMAT: HttpStatus.BAD_REQUEST,

  // Códigos de error módulo usuarios aplicación
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
};
