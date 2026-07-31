import { Response } from 'express';

import { ServerErrorResponse } from '../../domain/types';

export const handleHttpError = (
  res: Response,
  serverErrorResponse: ServerErrorResponse,
): void => {
  res.status(serverErrorResponse.httpCode).json({
    status: 'error',
    ...serverErrorResponse,
  });
};
