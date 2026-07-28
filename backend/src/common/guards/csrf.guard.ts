import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../helpers/set-auth-cookies';

export const SKIP_CSRF_KEY = 'skipCsrf';

/** مخرج للحالات التي لا تمر عبر متصفح إطلاقاً (webhooks مثلاً). */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * ترويسات لا يستطيع أي <form> عبر المواقع إرسالها.
 * وجود أي منها يجبر المتصفح على preflight، والـ preflight يمر على قائمة
 * الأصول المسموحة في enableCors فيُرفض أصل المهاجم قبل تنفيذ الطلب.
 */
const CSRF_SAFE_HEADERS = ['client-type', 'x-requested-with'] as const;

const AUTH_COOKIES = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE];

/**
 * حماية CSRF للطلبات المُصادَق عليها بالكوكيز.
 *
 * ضرورية لأن الكوكيز تصبح SameSite=None في وضع cross-site، فيرسلها
 * المتصفح مع طلب صادر من أي موقع. الطلب البسيط (<form method="POST">)
 * لا يستدعي preflight، لذلك لا تحميه قائمة أصول CORS وحدها.
 *
 * الطلبات الحاملة لـ Bearer فقط ليست عرضة لهذا: لا يستطيع موقع آخر
 * ضبط ترويسة Authorization، لذلك تُترك دون فحص.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!STATE_CHANGING_METHODS.has((request.method ?? '').toUpperCase())) {
      return true;
    }

    const cookies: Record<string, unknown> = request.cookies ?? {};
    const usesCookieAuth = AUTH_COOKIES.some((name) => Boolean(cookies[name]));

    if (!usesCookieAuth) {
      return true;
    }

    const headers = request.headers ?? {};
    const hasSafeHeader = CSRF_SAFE_HEADERS.some((name) =>
      Boolean(headers[name]),
    );

    if (!hasSafeHeader) {
      throw new ForbiddenException(
        `CSRF protection: cookie-authenticated requests must send one of these headers: ${CSRF_SAFE_HEADERS.join(
          ', ',
        )}`,
      );
    }

    return true;
  }
}
