import { InvalidTokenException } from '../../exceptions';

import { JwtAccessToken } from '../jwt-access-token.vo';

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
});
