import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CsrfGuard, SKIP_CSRF_KEY } from './csrf.guard';

type RequestLike = {
  method?: string;
  cookies?: Record<string, unknown>;
  headers?: Record<string, unknown>;
};

function createContext(
  request: RequestLike,
  type: 'http' | 'ws' = 'http',
): ExecutionContext {
  return {
    getType: () => type,
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    guard = new CsrfGuard(reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('يمنع الطلبات الخطرة', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
      'يرفض %s المُصادق عليه بالكوكيز بدون ترويسة مخصصة',
      (method) => {
        const context = createContext({
          method,
          cookies: { access_token: 'jwt' },
          headers: {},
        });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      },
    );

    it('يرفض حتى لو كانت كوكي refresh_token هي الموجودة فقط', () => {
      const context = createContext({
        method: 'POST',
        cookies: { refresh_token: 'jwt' },
        headers: {},
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('يحاكي هجوم form عبر المواقع فيرفضه', () => {
      // <form method="POST"> لا يستطيع ضبط ترويسات مخصصة
      const context = createContext({
        method: 'POST',
        cookies: { access_token: 'jwt' },
        headers: {
          origin: 'https://attacker.example',
          'content-type': 'application/x-www-form-urlencoded',
        },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('يسمح بالطلبات المشروعة', () => {
    it('يسمح عند وجود ترويسة client-type', () => {
      const context = createContext({
        method: 'POST',
        cookies: { access_token: 'jwt' },
        headers: { 'client-type': 'WEB' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('يسمح عند وجود ترويسة x-requested-with', () => {
      const context = createContext({
        method: 'DELETE',
        cookies: { access_token: 'jwt' },
        headers: { 'x-requested-with': 'XMLHttpRequest' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('يسمح بمصادقة Bearer دون ترويسة إضافية', () => {
      // موقع آخر لا يستطيع ضبط Authorization، فلا خطر CSRF
      const context = createContext({
        method: 'POST',
        cookies: {},
        headers: { authorization: 'Bearer token' },
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('يسمح بتسجيل الدخول قبل وجود أي كوكي', () => {
      const context = createContext({
        method: 'POST',
        cookies: {},
        headers: {},
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it.each(['GET', 'HEAD', 'OPTIONS'])(
      'يسمح بـ %s لأنه لا يغيّر الحالة',
      (method) => {
        const context = createContext({
          method,
          cookies: { access_token: 'jwt' },
          headers: {},
        });

        expect(guard.canActivate(context)).toBe(true);
      },
    );

    it('يتجاهل الطلبات غير الـ HTTP', () => {
      const context = createContext(
        { method: 'POST', cookies: { access_token: 'jwt' }, headers: {} },
        'ws',
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('يحترم SkipCsrf', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createContext({
        method: 'POST',
        cookies: { access_token: 'jwt' },
        headers: {},
      });

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        SKIP_CSRF_KEY,
        expect.anything(),
      );
    });
  });

  describe('الحالات الحدية', () => {
    it('يتعامل مع request بدون cookies أو headers', () => {
      const context = createContext({ method: 'POST' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('لا يتأثر بحالة أحرف الميثود', () => {
      const context = createContext({
        method: 'post',
        cookies: { access_token: 'jwt' },
        headers: {},
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('يتجاهل الكوكي الفارغة فلا يعتبرها مصادقة', () => {
      const context = createContext({
        method: 'POST',
        cookies: { access_token: '' },
        headers: {},
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
