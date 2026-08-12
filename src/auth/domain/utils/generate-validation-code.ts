export const generateVerificationCode = (): string => {
  /** genera un código númerico de 6 digitos */
  return Math.floor(100000 + Math.random() * 900000).toString();
};
