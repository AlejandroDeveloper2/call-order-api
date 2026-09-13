export const getIdentityValidationEmailTemplate = (code: string) => {
  return `<p>Tu código de verificación es:</p>
      <p><strong>${code}</strong></p>
      <p>Este código expirará en 10 minutos.</p>`;
};
