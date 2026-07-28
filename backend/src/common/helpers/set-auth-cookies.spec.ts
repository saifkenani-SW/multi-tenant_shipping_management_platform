import type { Response } from 'express';

import { clearAuthCookies, setAuthCookies } from './set-auth-cookies';

function createResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response & {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };
}

describe('auth cookies', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('وضع cross-site', () => {
    beforeEach(() => {
      process.env.COOKIE_CROSS_SITE = 'true';
    });

    it('يستخدم SameSite=None مع Secure ليقبلها المتصفح', () => {
      const res = createResponse();

      setAuthCookies(res, 'access', 'refresh');

      for (const call of res.cookie.mock.calls) {
        expect(call[2]).toMatchObject({
          httpOnly: true,
          sameSite: 'none',
          secure: true,
        });
      }
    });

    it('يفرض Secure حتى خارج بيئة الإنتاج', () => {
      process.env.NODE_ENV = 'development';
      const res = createResponse();

      setAuthCookies(res, 'access', 'refresh');

      // SameSite=None بدون Secure يرفضه المتصفح كلياً
      expect(res.cookie.mock.calls[0][2].secure).toBe(true);
    });
  });

  describe('وضع same-origin', () => {
    beforeEach(() => {
      process.env.COOKIE_CROSS_SITE = 'false';
    });

    it('يبقى على SameSite=Strict', () => {
      const res = createResponse();

      setAuthCookies(res, 'access', 'refresh');

      for (const call of res.cookie.mock.calls) {
        expect(call[2].sameSite).toBe('strict');
      }
    });

    it('لا يفرض Secure في بيئة التطوير', () => {
      process.env.NODE_ENV = 'development';
      const res = createResponse();

      setAuthCookies(res, 'access', 'refresh');

      expect(res.cookie.mock.calls[0][2].secure).toBe(false);
    });

    it('يفرض Secure في بيئة الإنتاج', () => {
      process.env.NODE_ENV = 'production';
      const res = createResponse();

      setAuthCookies(res, 'access', 'refresh');

      expect(res.cookie.mock.calls[0][2].secure).toBe(true);
    });
  });

  describe('المسارات والقيم', () => {
    it('يضبط الكوكيّتين بالمسارين الصحيحين', () => {
      const res = createResponse();

      setAuthCookies(res, 'access-value', 'refresh-value');

      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'access-value',
        expect.objectContaining({ path: '/' }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-value',
        expect.objectContaining({ path: '/auth/refresh' }),
      );
    });
  });

  describe('clearAuthCookies', () => {
    it('يطابق خصائص الضبط وإلا لن يحذف المتصفح الكوكي', () => {
      process.env.COOKIE_CROSS_SITE = 'true';
      const res = createResponse();

      clearAuthCookies(res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          path: '/',
          sameSite: 'none',
          secure: true,
          httpOnly: true,
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          path: '/auth/refresh',
          sameSite: 'none',
          secure: true,
        }),
      );
    });
  });
});
