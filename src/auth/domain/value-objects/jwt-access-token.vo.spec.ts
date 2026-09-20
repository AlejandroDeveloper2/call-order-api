import { InvalidTokenException } from '../exceptions';

import { JwtAccessToken } from './jwt-access-token.vo';

describe('jwtAccessTokenVo', () => {
  describe('create', () => {
    it('deberia lanzar InvalidTokenException si el token de acceso es un string vacio', () => {
      expect(() => JwtAccessToken.create('')).toThrow(InvalidTokenException);
    });

    it('deberia lanzar InvalidTokenException si el token de acceso no tiene un formato valido', () => {
      expect(() => JwtAccessToken.create('token-11')).toThrow(
        InvalidTokenException,
      );
    });

    it('deberia crear el value object cuando el token de acceso es válido', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
      const accessToken = JwtAccessToken.create(token);

      expect(accessToken).toBeInstanceOf(JwtAccessToken);
      expect(accessToken.toString()).toBe(token);
    });
  });

  describe('equals', () => {
    it('deberia devolver verdadero si dos tokens de acceso tienen el mismo valor', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
      const otherAccessToken = JwtAccessToken.create(token);
      const accessToken = JwtAccessToken.create(token);

      const result = accessToken.equals(otherAccessToken);

      expect(result).toBe(true);
    });

    it('deberia devolver falso si dos tokens no tienen el mismo valor', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
      const otherToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV32';

      const otherAccessToken = JwtAccessToken.create(otherToken);
      const accessToken = JwtAccessToken.create(token);

      const result = accessToken.equals(otherAccessToken);

      expect(result).toBe(false);
    });
  });
});
