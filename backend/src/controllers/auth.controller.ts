import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { clearAuthCookies, hashToken, randomToken, setAuthCookies } from '../lib/security';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../utils/activityLogger';

const publicUser = (user: { id: number; name: string; email: string; role: string }) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const createSession = async (userId: number, res: Response) => {
  const sessionToken = randomToken();
  const csrfToken = randomToken();
  const expiresAt = new Date(Date.now() + Number(process.env.SESSION_TTL_HOURS || 24) * 3600000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(sessionToken), csrfHash: hashToken(csrfToken), expiresAt } });
  setAuthCookies(res, sessionToken, csrfToken, expiresAt);
  return csrfToken;
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) {
    res.status(401).json({ success: false, message: 'Email atau password salah.' });
    return;
  }
  if (!(await bcrypt.compare(password, user.password))) {
    const threshold = Number(process.env.LOGIN_LOCK_THRESHOLD || 5);
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: user.id }, data: { failedLoginAttempts: { increment: 1 } } });
      if (updated.failedLoginAttempts >= threshold) {
        const lockMinutes = Math.min(60, 2 ** Math.max(0, updated.failedLoginAttempts - threshold));
        await tx.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() + lockMinutes * 60000) } });
      }
    });
    res.status(401).json({ success: false, message: 'Email atau password salah.' });
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  const csrfToken = await createSession(user.id, res);
  await logActivity(user.id, 'LOGIN', 'Berhasil masuk ke sistem', null, req.ip);
  res.json({ success: true, data: { user: publicUser(user), csrfToken } });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  res.json({ success: true, data: { user, csrfToken: req.cookies[process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf'] } });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.session.update({ where: { id: req.session!.id }, data: { revokedAt: new Date() } });
  clearAuthCookies(res);
  res.json({ success: true });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = (req as any).body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !(await bcrypt.compare(currentPassword || '', user.password))) {
    res.status(401).json({ success: false, message: 'Password saat ini tidak benar.' });
    return;
  }
  if (typeof newPassword !== 'string' || newPassword.length < 12) {
    res.status(400).json({ success: false, message: 'Password baru minimal 12 karakter.' });
    return;
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 12) } }),
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  clearAuthCookies(res);
  res.json({ success: true });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = (req as any).body;
  const updated = await prisma.user.update({ where: { id: req.user!.id }, data: { name: String(body.name).trim().slice(0, 100), email: String(body.email).trim().toLowerCase().slice(0, 100) }, select: { id: true, name: true, email: true, role: true } });
  res.json({ success: true, data: updated });
};
