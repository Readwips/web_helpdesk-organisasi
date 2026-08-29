import { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import prisma from '../lib/prisma';
import { hashToken } from '../lib/security';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string; technicianId: number | null };
  session?: { id: string; csrfHash: string };
  cookies: Record<string, string>;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.[process.env.SESSION_COOKIE_NAME || 'helpdesk_session'];
  if (!token) {
    res.status(401).json({ success: false, message: 'Sesi tidak ditemukan.' });
    return;
  }
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, role: true, technicianId: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    res.status(401).json({ success: false, message: 'Sesi tidak valid atau sudah berakhir.' });
    return;
  }
  req.user = session.user;
  req.session = { id: session.id, csrfHash: session.csrfHash };
  next();
};

export const requireCsrf = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const token = req.header('x-csrf-token');
  const cookie = req.cookies?.[process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf'];
  if (!token || !cookie || token !== cookie || !req.session) {
    res.status(403).json({ success: false, message: 'Token CSRF tidak valid.' });
    return;
  }
  const actual = Buffer.from(hashToken(token));
  const expected = Buffer.from(req.session.csrfHash);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    res.status(403).json({ success: false, message: 'Token CSRF tidak valid.' });
    return;
  }
  next();
};

export const authorize = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Akses ditolak. Tidak memiliki izin.' });
    return;
  }
  next();
};
