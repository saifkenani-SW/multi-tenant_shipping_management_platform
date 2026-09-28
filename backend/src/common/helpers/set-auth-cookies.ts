export function setAuthCookies(
  res: any,
  accessToken: string,
  refreshToken: string,
): void {
  const setCookie = (name: string, value: string, options: any) => {
    if (typeof res.setCookie === 'function') {
      res.setCookie(name, value, options);
    } else if (typeof res.cookie === 'function') {
      res.cookie(name, value, options);
    }
  };

  setCookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  setCookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh',
  });
}

