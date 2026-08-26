export abstract class VerificationCodeLookupPort {
  abstract generateLookup(code: string): string;
}

export const VERIFICATION_CODE_LOOK_UP = Symbol('VERIFICATION_CODE_LOOK_UP');
