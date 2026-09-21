import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost, HttpArgumentsHost } from '@nestjs/common/interfaces';

import { InvalidEmailException } from '../../../auth/domain/exceptions';
import { AccountNotFoundException } from '../../../auth/application/exceptions';
import { FileUploadException } from '../exceptions';

import { AppExceptionFilter } from './app-exception.filter';

type ArgumentsHostMock = jest.Mocked<Pick<ArgumentsHost, 'switchToHttp'>>;
type HttpArgumentsHostMock = jest.Mocked<
  Pick<HttpArgumentsHost, 'getRequest' | 'getResponse'>
>;

describe('AppExceptionFilter', () => {
  let argumentsHostMock: ArgumentsHostMock;
  let httpArgumentsHostMock: HttpArgumentsHostMock;

  beforeEach(() => {
    httpArgumentsHostMock = {
      getResponse: jest.fn(),
      getRequest: jest.fn(),
    };
    argumentsHostMock = {
      switchToHttp: jest.fn().mockReturnValue(httpArgumentsHostMock),
    };

    jest.clearAllMocks();
  });

  const createHost = (url = '/api/test') => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    httpArgumentsHostMock.getResponse.mockReturnValue(response);
    httpArgumentsHostMock.getRequest.mockReturnValue({ url });

    argumentsHostMock.switchToHttp.mockReturnValue(
      httpArgumentsHostMock as unknown as HttpArgumentsHost,
    );

    return { host: argumentsHostMock, response };
  };

  it('deberia convertir una excepcion de dominio al contrato de error', () => {
    // Arrange
    const filter = new AppExceptionFilter();
    const { host, response } = createHost();
    const exception = new InvalidEmailException('Correo inválido');

    // Act
    filter.catch(exception, host as unknown as ArgumentsHost);

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
    filter.catch(exception, host as unknown as ArgumentsHost);

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
    filter.catch(exception, host as unknown as ArgumentsHost);

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
    filter.catch(exception, host as unknown as ArgumentsHost);

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
    filter.catch(
      new Error('Error inesperado'),
      host as unknown as ArgumentsHost,
    );

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
