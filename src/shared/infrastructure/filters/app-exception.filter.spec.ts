import { HttpException, HttpStatus } from '@nestjs/common';

import { InvalidEmailException } from '../../../auth/domain/exceptions';
import { AccountNotFoundException } from '../../../auth/application/exceptions';
import { FileUploadException } from '../exceptions';
import { AppExceptionFilter } from './app-exception.filter';

describe('AppExceptionFilter', () => {
  const createHost = (url = '/api/test') => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url }),
      }),
    };

    return { host: host as never, response };
  };

  it('deberia convertir una excepcion de dominio al contrato de error', () => {
    // Arrange
    const filter = new AppExceptionFilter();
    const { host, response } = createHost();
    const exception = new InvalidEmailException('Correo inválido');

    // Act
    filter.catch(exception, host);

    // Assert
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        name: 'INVALID_EMAIL',
        httpCode: HttpStatus.BAD_REQUEST,
        isOperational: true,
        description: 'Correo inválido',
        path: '/api/test',
      }),
    );
  });

  it('deberia convertir una excepcion de aplicacion al contrato de error', () => {
    // Arrange
    const filter = new AppExceptionFilter();
    const { host, response } = createHost();
    const exception = new AccountNotFoundException('Cuenta no encontrada');

    // Act
    filter.catch(exception, host);

    // Assert
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ACCOUNT_NOT_FOUND' }),
    );
  });

  it('deberia convertir una excepcion de infraestructura al contrato de error', () => {
    // Arrange
    const filter = new AppExceptionFilter();
    const { host, response } = createHost();
    const exception = new FileUploadException(
      'No fue posible subir el archivo',
    );

    // Act
    filter.catch(exception, host);

    // Assert
    expect(response.status).toHaveBeenCalledWith(HttpStatus.FAILED_DEPENDENCY);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'FILE_UPLOAD_ERROR' }),
    );
  });

  it('deberia conservar el estado y nombre de una HttpException', () => {
    // Arrange
    const filter = new AppExceptionFilter();
    const { host, response } = createHost();
    const exception = new HttpException(
      'No autorizado',
      HttpStatus.UNAUTHORIZED,
    );

    // Act
    filter.catch(exception, host);

    // Assert
    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'HttpException',
        httpCode: HttpStatus.UNAUTHORIZED,
        description: 'No autorizado',
      }),
    );
  });

  it('deberia responder INTERNAL_SERVER_ERROR para errores desconocidos', () => {
    // Arrange
    const filter = new AppExceptionFilter();
    const { host, response } = createHost();

    // Act
    filter.catch(new Error('Error inesperado'), host);

    // Assert
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'INTERNAL_SERVER_ERROR',
        httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
        isOperational: false,
      }),
    );
  });
});
