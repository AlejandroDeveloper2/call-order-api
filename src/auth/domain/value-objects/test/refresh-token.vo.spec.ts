import { InvalidRefreshTokenException } from '../../exceptions';

import { RefreshToken } from '../refresh-token.vo';

describe('refreshTokenVo', () => {
  describe('create', () => {
    it('deberia lanzar InvalidRefreshTokenException si el refresh token es un string vacio', () => {
      expect(() => RefreshToken.create('')).toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('deberia lanzar InvalidRefreshTokenException si el refresh token no tiene un formato valido', () => {
      expect(() => RefreshToken.create('refresh-token-11')).toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('deberia crear el value object cuando el refresh token es válido', () => {
      const token =
        '3de3bc8b981cfecb3116b1a643163886e011fbfd877aba391298b1f3a56c012f8b3bcfb55643a08372ddcd3d1ab0c939e83fc236360ec289f9444b6c0cc9a7d0';

      const refreshToken = RefreshToken.create(token);

      expect(refreshToken).toBeInstanceOf(RefreshToken);
      expect(refreshToken.toString()).toBe(token);
    });
  });
});
