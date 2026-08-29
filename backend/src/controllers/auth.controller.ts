import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import prisma from '../lib/prisma';
import { clearAuthCookies, decryptSecret, encryptSecret, hashToken, randomToken, setAuthCookies } from '../lib/security';
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
  if (user.role === 'ADMIN' && user.totpEnabled) {
    const challenge = randomToken();
    await prisma.mfaChallenge.create({ data: { userId: user.id, tokenHash: hashToken(challenge), expiresAt: new Date(Date.now() + 5 * 60000) } });
    res.status(202).json({ success: true, data: { mfaRequired: true, challenge } });
    return;
  }
  const csrfToken = await createSession(user.id, res);
  await logActivity(user.id, 'LOGIN', 'Berhasil masuk ke sistem', null, req.ip);
  res.json({ success: true, data: { user: publicUser(user), csrfToken } });
};

export const verifyMfa = async (req: Request, res: Response): Promise<void> => {
  const challengeToken = String(req.body.challenge || '');
  const code = String(req.body.code || '');
  const challenge = await prisma.mfaChallenge.findUnique({ where: { tokenHash: hashToken(challengeToken) } });
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
    res.status(401).json({ success: false, message: 'Tantangan MFA tidak valid.' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
  if (!user?.totpEnabled || !user.totpSecretEncrypted || !verifySync({ token: code, secret: decryptSecret(user.totpSecretEncrypted) }).valid) {
    res.status(401).json({ success: false, message: 'Kode MFA tidak valid.' });
    return;
  }
  const step = BigInt(Math.floor(Date.now() / 30000));
  if (user.lastTotpStep && user.lastTotpStep >= step) {
    res.status(401).json({ success: false, message: 'Kode MFA sudah digunakan.' });
    return;
  }
  const accepted = await prisma.$transaction(async (tx) => {
    const challengeResult = await tx.mfaChallenge.updateMany({ where: { id: challenge.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    const replayResult = await tx.user.updateMany({ where: { id: user.id, OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: step } }] }, data: { lastTotpStep: step } });
    if (challengeResult.count !== 1 || replayResult.count !== 1) throw new Error('MFA_REPLAY');
    return true;
  }).catch(() => false);
  if (!accepted) {
    res.status(401).json({ success: false, message: 'Kode MFA sudah digunakan.' });
    return;
  }
  const csrfToken = await createSession(user.id, res);
  res.json({ success: true, data: { user: publicUser(user), csrfToken } });
};

export const setupMfa = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const { currentPassword, currentTotpCode } = req.body;
  if (!user || !(await bcrypt.compare(String(currentPassword || ''), user.password))) {
    res.status(401).json({ success: false, message: 'Reautentikasi gagal.' });
    return;
  }
  if (user.totpEnabled && (!user.totpSecretEncrypted || !verifySync({ token: String(currentTotpCode || ''), secret: decryptSecret(user.totpSecretEncrypted) }).valid)) {
    res.status(401).json({ success: false, message: 'Kode MFA aktif tidak valid.' });
    return;
  }
  const secret = generateSecret();
  await prisma.user.update({ where: { id: req.user.id }, data: { pendingTotpSecretEncrypted: encryptSecret(secret), pendingTotpCreatedAt: new Date() } });
  res.json({ success: true, data: { secret, otpauthUrl: generateURI({ label: req.user.email, issuer: process.env.TOTP_ISSUER || 'IT Helpdesk', secret }) } });
};

export const enableMfa = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.pendingTotpSecretEncrypted || !user.pendingTotpCreatedAt || user.pendingTotpCreatedAt < new Date(Date.now() - 10 * 60000) || !verifySync({ token: String(req.body.code || ''), secret: decryptSecret(user.pendingTotpSecretEncrypted) }).valid) {
    res.status(400).json({ success: false, message: 'Kode MFA tidak valid.' });
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { totpSecretEncrypted: user.pendingTotpSecretEncrypted, pendingTotpSecretEncrypted: null, pendingTotpCreatedAt: null, totpEnabled: true, lastTotpStep: BigInt(Math.floor(Date.now() / 30000)) } });
  res.json({ success: true });
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
