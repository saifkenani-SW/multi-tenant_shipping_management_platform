import { Controller, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { CsrfGuard } from './csrf.guard';

@Controller('protected')
class ProtectedController {
  @Post('action')
  action() {
    return { ok: true };
  }
}

/**
 * يتحقق من السلوك الفعلي عبر HTTP: ترويسات CORS الحقيقية التي يرسلها
 * السيرفر، ورفض CsrfGuard لطلب مزوَّر عبر المواقع.
 */
describe('CORS + CSRF (تكامل)', () => {
  let app: INestApplication;
  const ALLOWED = 'http://localhost:4200';
  const ATTACKER = 'https://attacker.example';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProtectedController],
      providers: [{ provide: APP_GUARD, useClass: CsrfGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());

    // نفس منطق main.ts
    const corsOrigins = (process.env.CORS_ORIGIN ?? ALLOWED)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    app.enableCors({ origin: corsOrigins, credentials: true });

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('CORS', () => {
    it('يعيد Access-Control-Allow-Origin للأصل المسموح', async () => {
      const res = await request(app.getHttpServer())
        .options('/protected/action')
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('لا يعيد الترويسة لأصل غير مسموح', async () => {
      const res = await request(app.getHttpServer())
        .options('/protected/action')
        .set('Origin', ATTACKER)
        .set('Access-Control-Request-Method', 'POST');

      // غياب الترويسة هو ما يجعل المتصفح يحجب الرد
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('يسمح بالترويسة المخصصة في الـ preflight', async () => {
      const res = await request(app.getHttpServer())
        .options('/protected/action')
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'client-type');

      expect(res.headers['access-control-allow-headers']).toContain(
        'client-type',
      );
    });
  });

  describe('CSRF', () => {
    it('يرفض طلب form مزوَّر يحمل كوكي المصادقة', async () => {
      const res = await request(app.getHttpServer())
        .post('/protected/action')
        .set('Origin', ATTACKER)
        .set('Cookie', 'access_token=stolen-session')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('foo=bar');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CSRF');
    });

    it('يقبل الطلب الشرعي من الفرونت مع client-type', async () => {
      const res = await request(app.getHttpServer())
        .post('/protected/action')
        .set('Origin', ALLOWED)
        .set('Cookie', 'access_token=valid-session')
        .set('client-type', 'WEB')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ok: true });
    });

    it('يقبل عميل Bearer دون ترويسة إضافية', async () => {
      const res = await request(app.getHttpServer())
        .post('/protected/action')
        .set('Authorization', 'Bearer token')
        .send({});

      expect(res.status).toBe(201);
    });
  });
});
