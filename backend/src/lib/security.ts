import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';

export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== 'false',
  sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
  path: '/',
});

export const setAuthCookies = (res: Response, sessionToken: string, csrfToken: string, expiresAt: Date) => {
  res.cookie(process.env.SESSION_COOKIE_NAME || 'helpdesk_session', sessionToken, { ...cookieOptions(), expires: expiresAt });
  res.cookie(process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf', csrfToken, {
    secure: process.env.COOKIE_SECURE !== 'false',
    sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
    path: '/',
    expires: expiresAt,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(process.env.SESSION_COOKIE_NAME || 'helpdesk_session', cookieOptions());
  res.clearCookie(process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf', { path: '/' });
};
