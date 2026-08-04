import { HttpException, HttpStatus } from '@nestjs/common';

export class AppError extends HttpException {
  public readonly name: string;
  public readonly httpCode: number;
  public readonly isOperational: boolean;

  constructor(
    name: string,
    httpCode: number,
    description: string,
    isOperational = true,
  ) {
    super(
      {
        name,
        message: description,
        httpCode,
        isOperational,
      },
      httpCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
    );

    this.name = name;
    this.httpCode = httpCode;
    this.isOperational = isOperational;
  }
}
