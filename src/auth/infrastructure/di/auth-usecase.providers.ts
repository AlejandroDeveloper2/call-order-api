import { Provider } from '@nestjs/common';

/** Casos de uso */
import {
  ChangePasswordUseCase,
  CreateAccountUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
  ResendCodeUseCase,
  UpdateEmailUseCase,
  UpdatePasswordUseCase,
  ValidateAccessTokenUseCase,
  ValidateIdentityUseCase,
  ValidateSessionUseCase,
} from '../../application/use-cases';

/** Puertos */
import {
  AccessTokenGeneratorPort,
  AccessTokenVerifierPort,
  AccountRepositoryPort,
  EncryptorPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  VerificationCodeRepositoryPort,
} from '../../domain/ports';

import {
  EmailSenderPort,
  IdGeneratorPort,
  TransactionManagerPort,
} from '../../../shared/domain/ports';

import {
  PermissionRepositoryPort,
  UserRepositoryPort,
} from '../../../users/domain/ports';

export const AUTH_USE_CASE_PROVIDERS: Provider[] = [
  {
    provide: ChangePasswordUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      encryptor: EncryptorPort,
    ) => {
      return new ChangePasswordUseCase(accountRepository, encryptor);
    },

    inject: [AccountRepositoryPort, EncryptorPort],
  },

  {
    provide: CreateAccountUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      userRepository: UserRepositoryPort,
      transactionManager: TransactionManagerPort,
      encryptor: EncryptorPort,
      idGenerator: IdGeneratorPort,
    ) => {
      return new CreateAccountUseCase(
        accountRepository,
        userRepository,
        transactionManager,
        encryptor,
        idGenerator,
      );
    },

    inject: [
      AccountRepositoryPort,
      UserRepositoryPort,
      TransactionManagerPort,
      EncryptorPort,
      IdGeneratorPort,
    ],
  },
  {
    provide: LoginUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      verificationCodeRepository: VerificationCodeRepositoryPort,
      emailSender: EmailSenderPort,
      encryptor: EncryptorPort,
      idGenerator: IdGeneratorPort,
    ) => {
      return new LoginUseCase(
        accountRepository,
        verificationCodeRepository,
        emailSender,
        encryptor,
        idGenerator,
      );
    },

    inject: [
      AccountRepositoryPort,
      VerificationCodeRepositoryPort,
      EmailSenderPort,
      EncryptorPort,
      IdGeneratorPort,
    ],
  },
  {
    provide: LogoutUseCase,

    useFactory: (
      sessionRepository: SessionRepositoryPort,
      encryptor: EncryptorPort,
    ) => {
      return new LogoutUseCase(sessionRepository, encryptor);
    },

    inject: [SessionRepositoryPort, EncryptorPort],
  },
  {
    provide: RefreshSessionUseCase,

    useFactory: (
      sessionRepository: SessionRepositoryPort,
      encryptor: EncryptorPort,
      accessTokenGenerator: AccessTokenGeneratorPort,
      accessTokenVerifier: AccessTokenVerifierPort,
      refreshTokenGenerator: RefreshTokenGeneratorPort,
    ) => {
      return new RefreshSessionUseCase(
        sessionRepository,
        encryptor,
        accessTokenGenerator,
        accessTokenVerifier,
        refreshTokenGenerator,
      );
    },

    inject: [
      SessionRepositoryPort,
      EncryptorPort,
      AccessTokenGeneratorPort,
      AccessTokenVerifierPort,
      RefreshTokenGeneratorPort,
    ],
  },

  {
    provide: ResendCodeUseCase,

    useFactory: (
      verificationCodeRepository: VerificationCodeRepositoryPort,
      emailSender: EmailSenderPort,
      encryptor: EncryptorPort,
    ) => {
      return new ResendCodeUseCase(
        verificationCodeRepository,
        emailSender,
        encryptor,
      );
    },

    inject: [VerificationCodeRepositoryPort, EmailSenderPort, EncryptorPort],
  },

  {
    provide: UpdateEmailUseCase,

    useFactory: (accountRepository: AccountRepositoryPort) => {
      return new UpdateEmailUseCase(accountRepository);
    },

    inject: [AccountRepositoryPort],
  },

  {
    provide: UpdatePasswordUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      encryptor: EncryptorPort,
    ) => {
      return new UpdatePasswordUseCase(accountRepository, encryptor);
    },

    inject: [AccountRepositoryPort, EncryptorPort],
  },

  {
    provide: ValidateIdentityUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      verificationCodeRepository: VerificationCodeRepositoryPort,
      sessionRepository: SessionRepositoryPort,
      transactionManager: TransactionManagerPort,
      idGenerator: IdGeneratorPort,
      encryptor: EncryptorPort,
      accessTokenGenerator: AccessTokenGeneratorPort,
      refreshTokenGenerator: RefreshTokenGeneratorPort,
    ) => {
      return new ValidateIdentityUseCase(
        accountRepository,
        verificationCodeRepository,
        sessionRepository,
        transactionManager,
        idGenerator,
        encryptor,
        accessTokenGenerator,
        refreshTokenGenerator,
      );
    },

    inject: [
      AccountRepositoryPort,
      VerificationCodeRepositoryPort,
      SessionRepositoryPort,
      TransactionManagerPort,
      IdGeneratorPort,
      EncryptorPort,
      AccessTokenGeneratorPort,
      RefreshTokenGeneratorPort,
    ],
  },

  {
    provide: ValidateSessionUseCase,

    useFactory: (
      sessionRepository: SessionRepositoryPort,
      encryptor: EncryptorPort,
      accessTokenVerifier: AccessTokenVerifierPort,
    ) => {
      return new ValidateSessionUseCase(
        sessionRepository,
        encryptor,
        accessTokenVerifier,
      );
    },

    inject: [SessionRepositoryPort, EncryptorPort, AccessTokenVerifierPort],
  },
  {
    provide: ValidateAccessTokenUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      permissionRespository: PermissionRepositoryPort,
    ) => {
      return new ValidateAccessTokenUseCase(
        accountRepository,
        permissionRespository,
      );
    },

    inject: [AccountRepositoryPort, PermissionRepositoryPort],
  },
];
