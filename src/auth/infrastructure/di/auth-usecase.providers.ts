import { Provider } from '@nestjs/common';

/** Casos de uso */
import {
  ChangePasswordUseCase,
  CreateAccountUseCase,
  FindAccountsUseCase,
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
  DATE_HANDLER,
  DateHandlerPort,
  ENCRYPTOR,
  EncryptorPort,
  REFRESH_TOKEN_GENERATOR,
  RefreshTokenGeneratorPort,
  SESSION_REPOSITORY,
  SessionRepositoryPort,
  TOKEN_HASHER,
  TokenHasherPort,
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
    provide: FindAccountsUseCase,

    useFactory: (accountRepository: AccountRepositoryPort) => {
      return new FindAccountsUseCase(accountRepository);
    },

    inject: [ACCOUNT_REPOSITORY],
  },
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
      dateHandler: DateHandlerPort,
    ) => {
      return new LoginUseCase(
        accountRepository,
        verificationCodeRepository,
        emailSender,
        encryptor,
        idGenerator,
        verificationCodeLookup,
        dateHandler,
      );
    },

    inject: [
      ACCOUNT_REPOSITORY,
      VERIFICATION_CODE_REPOSITORY,
      EMAIL_SENDER_KEY,
      ENCRYPTOR,
      ID_GENERATOR_KEY,
      VERIFICATION_CODE_LOOK_UP,
      DATE_HANDLER,
    ],
  },
  {
    provide: LogoutUseCase,

    useFactory: (
      sessionRepository: SessionRepositoryPort,
      tokenHasher: TokenHasherPort,
    ) => {
      return new LogoutUseCase(sessionRepository, tokenHasher);
    },

    inject: [SESSION_REPOSITORY, TOKEN_HASHER],
  },
  {
    provide: RefreshSessionUseCase,

    useFactory: (
      sessionRepository: SessionRepositoryPort,
      tokenHasher: TokenHasherPort,
      accessTokenGenerator: AccessTokenGeneratorPort,
      accessTokenVerifier: AccessTokenVerifierPort,
      refreshTokenGenerator: RefreshTokenGeneratorPort,
      dateHandler: DateHandlerPort,
    ) => {
      return new RefreshSessionUseCase(
        sessionRepository,
        tokenHasher,
        accessTokenGenerator,
        accessTokenVerifier,
        refreshTokenGenerator,
        dateHandler,
      );
    },

    inject: [
      SESSION_REPOSITORY,
      TOKEN_HASHER,
      ACCESS_TOKEN_GENERATOR,
      ACCESS_TOKEN_VERIFIER,
      REFRESH_TOKEN_GENERATOR,
      DATE_HANDLER,
    ],
  },

  {
    provide: ResendCodeUseCase,

    useFactory: (
      verificationCodeRepository: VerificationCodeRepositoryPort,
      emailSender: EmailSenderPort,
      encryptor: EncryptorPort,
      verificationCodeLookup: VerificationCodeLookupPort,
      dateHandler: DateHandlerPort,
    ) => {
      return new ResendCodeUseCase(
        verificationCodeRepository,
        emailSender,
        encryptor,
        verificationCodeLookup,
        dateHandler,
      );
    },

    inject: [
      VERIFICATION_CODE_REPOSITORY,
      EMAIL_SENDER_KEY,
      ENCRYPTOR,
      VERIFICATION_CODE_LOOK_UP,
      DATE_HANDLER,
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
      tokenHasher: TokenHasherPort,
      accessTokenGenerator: AccessTokenGeneratorPort,
      refreshTokenGenerator: RefreshTokenGeneratorPort,
      verificationCodeLookup: VerificationCodeLookupPort,
      dateHandler: DateHandlerPort,
    ) => {
      return new ValidateIdentityUseCase(
        accountRepository,
        verificationCodeRepository,
        sessionRepository,
        transactionManager,
        idGenerator,
        tokenHasher,
        accessTokenGenerator,
        refreshTokenGenerator,
        verificationCodeLookup,
        dateHandler,
      );
    },

    inject: [
      ACCOUNT_REPOSITORY,
      VERIFICATION_CODE_REPOSITORY,
      SESSION_REPOSITORY,
      TRANSACTION_MANAGER,
      ID_GENERATOR_KEY,
      TOKEN_HASHER,
      ACCESS_TOKEN_GENERATOR,
      REFRESH_TOKEN_GENERATOR,
      VERIFICATION_CODE_LOOK_UP,
      DATE_HANDLER,
    ],
  },

  {
    provide: ValidateSessionUseCase,

    useFactory: (
      sessionRepository: SessionRepositoryPort,
      tokenHasher: TokenHasherPort,
      accessTokenVerifier: AccessTokenVerifierPort,
    ) => {
      return new ValidateSessionUseCase(
        sessionRepository,
        tokenHasher,
        accessTokenVerifier,
      );
    },

    inject: [SESSION_REPOSITORY, TOKEN_HASHER, ACCESS_TOKEN_VERIFIER],
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
