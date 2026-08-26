import { addDays, addMinutes } from 'date-fns';

import { Role, User } from '../../../users/domain/entities';
import {
  Account,
  Session,
  VerificationCode,
} from '../../../auth/domain/entities';

export const buildProfile = (overrides: Partial<User> = {}): User => {
  const profile = new User();
  profile.userId = 'test-user-id';
  profile.fullname = 'Alejo Diaz';
  profile.isActive = true;
  profile.phone = '3105998799';
  profile.role = new Role('test-role-id', 'role-name');

  Object.assign(profile, overrides);

  return profile;
};

export const buildAccount = (overrides: Partial<Account> = {}): Account => {
  const profile = buildProfile();
  const account = {
    accountId: 'test-account-id',
    email: 'test@gmail.com',
    passwordHash: 'password-hash',
    mustChangePassword: false,
    failedAttempts: 0,
    profile,
    verificationCodes: [],
    sessions: [],
    ...overrides,
  };
  Object.assign(account, overrides);

  return account;
};

export const buildSession = (overrides: Partial<Session> = {}): Session => {
  const session = new Session(
    'test-session-id',
    'test-token-hash',
    'test-refresh-token-hash',
    addDays(new Date(), 1),
    new Date(),
    'Chrome',
    'Windows',
    '127.0.0.1',
    'Mozilla/5.0',
    undefined,
    'desktop',
    'PC',
  );

  Object.assign(session, overrides);

  return session;
};

export const buildVerificationCode = (
  overrides: Partial<VerificationCode> = {},
): VerificationCode => {
  const verificationCode = new VerificationCode(
    'test-verification-code-id',
    'test-code-hash',
    'double-factor',
    addMinutes(new Date(), 10),
    0,
    'test-account-id',
  );

  Object.assign(verificationCode, overrides);

  return verificationCode;
};
