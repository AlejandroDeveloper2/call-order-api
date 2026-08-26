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
  ACCESS_TOKEN_GENERATOR,
  ACCESS_TOKEN_VERIFIER,
  AccessTokenGeneratorPort,
  AccessTokenVerifierPort,
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  ENCRYPTOR,
  EncryptorPort,
  REFRESH_TOKEN_GENERATOR,
  RefreshTokenGeneratorPort,
  SESSION_REPOSITORY,
  SessionRepositoryPort,
  VERIFICATION_CODE_LOOK_UP,
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../domain/ports';

import {
  EMAIL_SENDER_KEY,
  EmailSenderPort,
  ID_GENERATOR_KEY,
  IdGeneratorPort,
  TRANSACTION_MANAGER,
  TransactionManagerPort,
} from '../../../shared/domain/ports';

import {
  PERMISSION_REPOSITORY,
  PermissionRepositoryPort,
  USER_REPOSITORY,
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

    inject: [ACCOUNT_REPOSITORY, ENCRYPTOR],
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
      ACCOUNT_REPOSITORY,
      USER_REPOSITORY,
      TRANSACTION_MANAGER,
      ENCRYPTOR,
      ID_GENERATOR_KEY,
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
      verificationCodeLookup: VerificationCodeLookupPort,
    ) => {
      return new LoginUseCase(
        accountRepository,
        verificationCodeRepository,
        emailSender,
        encryptor,
        idGenerator,
        verificationCodeLookup,
      );
    },

    inject: [
      ACCOUNT_REPOSITORY,
      VERIFICATION_CODE_REPOSITORY,
      EMAIL_SENDER_KEY,
      ENCRYPTOR,
      ID_GENERATOR_KEY,
      VERIFICATION_CODE_LOOK_UP,
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

    inject: [SESSION_REPOSITORY, ENCRYPTOR],
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
      SESSION_REPOSITORY,
      ENCRYPTOR,
      ACCESS_TOKEN_GENERATOR,
      ACCESS_TOKEN_VERIFIER,
      REFRESH_TOKEN_GENERATOR,
    ],
  },

  {
    provide: ResendCodeUseCase,

    useFactory: (
      verificationCodeRepository: VerificationCodeRepositoryPort,
      emailSender: EmailSenderPort,
      encryptor: EncryptorPort,
      verificationCodeLookup: VerificationCodeLookupPort,
    ) => {
      return new ResendCodeUseCase(
        verificationCodeRepository,
        emailSender,
        encryptor,
        verificationCodeLookup,
      );
    },

    inject: [
      VERIFICATION_CODE_REPOSITORY,
      EMAIL_SENDER_KEY,
      ENCRYPTOR,
      VERIFICATION_CODE_LOOK_UP,
    ],
  },

  {
    provide: UpdateEmailUseCase,

    useFactory: (accountRepository: AccountRepositoryPort) => {
      return new UpdateEmailUseCase(accountRepository);
    },

    inject: [ACCOUNT_REPOSITORY],
  },

  {
    provide: UpdatePasswordUseCase,

    useFactory: (
      accountRepository: AccountRepositoryPort,
      encryptor: EncryptorPort,
    ) => {
      return new UpdatePasswordUseCase(accountRepository, encryptor);
    },

    inject: [ACCOUNT_REPOSITORY, ENCRYPTOR],
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
      verificationCodeLookup: VerificationCodeLookupPort,
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
        verificationCodeLookup,
      );
    },

    inject: [
      ACCOUNT_REPOSITORY,
      VERIFICATION_CODE_REPOSITORY,
      SESSION_REPOSITORY,
      TRANSACTION_MANAGER,
      ID_GENERATOR_KEY,
      ENCRYPTOR,
      ACCESS_TOKEN_GENERATOR,
      REFRESH_TOKEN_GENERATOR,
      VERIFICATION_CODE_LOOK_UP,
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

    inject: [SESSION_REPOSITORY, ENCRYPTOR, ACCESS_TOKEN_VERIFIER],
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

    inject: [ACCOUNT_REPOSITORY, PERMISSION_REPOSITORY],
  },
];
