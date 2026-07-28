import type { CookieOptions, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** الـ refresh token لا يُرسل إلا لهذا المسار، فلا يتسرب مع كل طلب. */
export const REFRESH_TOKEN_COOKIE_PATH = '/auth/refresh';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * صحيح عندما يعمل الفرونت إند على أصل مختلف عن الـ API
 * (مثلاً localhost:4200 مقابل API منشور).
 *
 * المتصفح يرفض SameSite=None بدون Secure، لذلك نفعّلهما معاً.
 * وبما أن SameSite=None يفتح الباب أمام CSRF، فإن CsrfGuard هو ما يغلقه.
 */
function isCrossSite(): boolean {
  return process.env.COOKIE_CROSS_SITE === 'true';
}

/**
 * تُقرأ متغيرات البيئة عند كل نداء (وليس عند تحميل الوحدة) حتى تبقى
 * الدالة قابلة للاختبار وقابلة لإعادة الضبط أثناء التشغيل.
 */
function baseCookieOptions(): CookieOptions {
  const crossSite = isCrossSite();

  return {
    httpOnly: true,
    secure: crossSite || process.env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'strict',
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const base = baseCookieOptions();

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...base,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...base,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: REFRESH_TOKEN_COOKIE_PATH,
  });
}

/**
 * الحذف لا ينجح إلا إذا طابقت الخصائص ما استُخدم عند الضبط
 * (sameSite و secure و path)، وإلا اعتبرها المتصفح كوكي أخرى وأبقى الأصلية.
 */
export function clearAuthCookies(res: Response): void {
  const base = baseCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...base, path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...base,
    path: REFRESH_TOKEN_COOKIE_PATH,
  });
}
