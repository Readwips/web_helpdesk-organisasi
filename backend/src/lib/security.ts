import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
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

const encryptionKey = () => createHash('sha256').update(process.env.TOTP_ENCRYPTION_KEY || '').digest();

export const encryptSecret = (secret: string) => {
  if (!process.env.TOTP_ENCRYPTION_KEY) throw new Error('TOTP_ENCRYPTION_KEY belum dikonfigurasi.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
};

export const decryptSecret = (value: string) => {
  const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
