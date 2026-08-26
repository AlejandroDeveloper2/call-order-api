import { addDays, addMinutes } from 'date-fns';

import { User } from '../../../users/domain/entities';

import {
  Account,
  Session,
  VerificationCode,
} from '../../../auth/domain/entities';

export const buildProfile = (overrides: Partial<User> = {}): User => {
  const profile = User.create(
    'test-user-id',
    'Alejo Diaz',
    'test-role-id',
    undefined,
    '3105998799',
    true,
  );

  Object.assign(profile, overrides);

  return profile;
};

export const buildAccount = (overrides: Partial<Account> = {}): Account => {
  const account = Account.create(
    'test-account-id',
    'test@gmail.com',
    'password-hash',
    false,
    0,
    'test-profile-id',
  );
  Object.assign(account, overrides);
  return account;
};

export const buildSession = (overrides: Partial<Session> = {}): Session => {
  const session = Session.create(
    'test-session-id',
    'test-token-hash',
    'test-refresh-token-hash',
    addDays(new Date(), 1),
    new Date(),
    'test-account-id',
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
  const verificationCode = VerificationCode.create(
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
