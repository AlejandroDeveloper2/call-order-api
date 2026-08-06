import { AppError, SHARED_ERROR_CODES } from '../exceptions';

export const handleServerError = (error: unknown) => {
  const e = error as Error;
  throw new AppError(
    SHARED_ERROR_CODES.internalServerError,
    500,
    e.message,
    false,
  );
};
