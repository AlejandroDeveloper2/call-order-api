import { TransactionContext } from '../../../shared/domain/ports';

import { VerificationCode } from '../entities';

import { VerificationCodeValidationModel } from '../models';

export abstract class VerificationCodeRepositoryPort {
  abstract findForIdentityValidation(
    email: string,
  ): Promise<VerificationCodeValidationModel[]>;

  abstract findExpiredForForwarding(
    email: string,
  ): Promise<VerificationCodeValidationModel[]>;

  abstract create(verificationCode: VerificationCode): Promise<void>;

  abstract markAsUsed(
    verificationCodeId: string,
    usedAt: Date,
    context?: TransactionContext,
  ): Promise<number>;

  abstract refresh(
    verificationCodeId: string,
    payload: {
      attempts: number;
      codeHash: string;
      expiresAt: Date;
    },
  ): Promise<number>;
}

export const VERIFICATION_CODE_REPOSITORY = 'VERIFICATION_CODE_REPOSITORY';
