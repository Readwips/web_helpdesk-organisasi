import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const prisma = vi.hoisted(() => ({
  session: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  ticket: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn(), create: vi.fn() },
  importJob: { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  category: { upsert: vi.fn() }, department: { upsert: vi.fn(), findFirst: vi.fn(), create: vi.fn() }, technician: { findFirst: vi.fn() },
  mfaChallenge: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  verificationToken: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  employee: { findUnique: vi.fn() }, notification: { createMany: vi.fn() },
  $transaction: vi.fn(async (operation) => typeof operation === 'function' ? operation(prisma) : Promise.all(operation)),
}));
vi.mock('../src/lib/prisma', () => ({ default: prisma }));
vi.mock('../src/utils/activityLogger', () => ({ logActivity: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(async (_password: string, hash: string) => hash === 'valid'), hash: vi.fn(async () => 'hashed') } }));
vi.mock('otplib', () => ({ authenticator: { verify: vi.fn(() => true), generateSecret: vi.fn(() => 'secret'), keyuri: vi.fn(() => 'otpauth://test') } }));

import express from 'express';
import cookieParser from 'cookie-parser';
import { authRoutes } from '../src/routes/auth.routes';
import { ticketRoutes } from '../src/routes/ticket.routes';
import { importRoutes } from '../src/routes/import.routes';
import { publicRoutes } from '../src/routes/public.routes';
import { encryptSecret, hashToken } from '../src/lib/security';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/import', importRoutes);
app.use('/public', publicRoutes);

const session = (role: string, technicianId: number | null = null) => {
  prisma.session.findUnique.mockResolvedValue({ id: 'session', csrfHash: hashToken('csrf'), revokedAt: null, expiresAt: new Date(Date.now() + 60000), user: { id: 1, email: 'a@b.co', role, technicianId } });
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.COOKIE_SECURE = 'false';
  process.env.TOTP_ENCRYPTION_KEY = 'test-key';
});

describe('session and CSRF HTTP seam', () => {
  it('rejects bearer credentials and requires a database session cookie', async () => {
    await request(app).get('/auth/me').set('Authorization', 'Bearer old-jwt').expect(401);
  });

  it('rejects unsafe authenticated requests without CSRF and revokes logout session', async () => {
    session('ADMIN');
    await request(app).post('/auth/logout').set('Cookie', 'helpdesk_session=session-token').expect(403);
    await request(app).post('/auth/logout').set('Cookie', ['helpdesk_session=session-token', 'helpdesk_csrf=csrf']).set('X-CSRF-Token', 'csrf').expect(200);
    expect(prisma.session.update).toHaveBeenCalledWith(expect.objectContaining({ data: { revokedAt: expect.any(Date) } }));
  });

  it('atomically increments failed-login attempts and locks at the threshold', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'invalid', failedLoginAttempts: 4, lockedUntil: null });
    prisma.user.update.mockResolvedValueOnce({ failedLoginAttempts: 5 }).mockResolvedValueOnce({});
    await request(app).post('/auth/login').send({ email: 'admin@test.co', password: 'bad' }).expect(401);
    expect(prisma.user.update).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: { failedLoginAttempts: { increment: 1 } } }));
    expect(prisma.user.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: { lockedUntil: expect.any(Date) } }));
  });

  it('allows only one concurrent MFA replay to create a session', async () => {
    prisma.mfaChallenge.findUnique.mockResolvedValue({ id: 'challenge', userId: 1, consumedAt: null, expiresAt: new Date(Date.now() + 60000) });
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Admin', email: 'admin@test.co', role: 'ADMIN', totpEnabled: true, totpSecretEncrypted: encryptSecret('secret'), lastTotpStep: null });
    let claimed = false;
    prisma.mfaChallenge.updateMany.mockImplementation(async () => claimed ? { count: 0 } : (claimed = true, { count: 1 }));
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.session.create.mockResolvedValue({});
    const responses = await Promise.all([request(app).post('/auth/mfa/verify').send({ challenge: 'token', code: '123456' }), request(app).post('/auth/mfa/verify').send({ challenge: 'token', code: '123456' })]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it('returns an MFA challenge without creating a session for enabled admin', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Admin', email: 'admin@test.co', password: 'valid', role: 'ADMIN', failedLoginAttempts: 0, lockedUntil: null, totpEnabled: true });
    prisma.user.update.mockResolvedValue({});
    prisma.mfaChallenge.create.mockResolvedValue({});
    const response = await request(app).post('/auth/login').send({ email: 'admin@test.co', password: 'ok' }).expect(202);
    expect(response.body.data.mfaRequired).toBe(true);
    expect(prisma.session.create).not.toHaveBeenCalled();
  });
});

describe('ticket policy HTTP seam', () => {
  it('hides another technician ticket on direct get', async () => {
    session('IT_SUPPORT', 10);
    prisma.ticket.findUnique.mockResolvedValue({ id: 9, technicianId: 11 });
    await request(app).get('/tickets/9').set('Cookie', 'helpdesk_session=x').expect(404);
  });

  it('scopes support lists to self and unassigned', async () => {
    session('IT_SUPPORT', 10);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);
    await request(app).get('/tickets').set('Cookie', 'helpdesk_session=x').expect(200);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [{ OR: [{ technicianId: 10 }, { technicianId: null }] }] } }));
  });

  it('preserves ownership scope when search is supplied', async () => {
    session('IT_SUPPORT', 10);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);
    await request(app).get('/tickets?search=secret').set('Cookie', 'helpdesk_session=x').expect(200);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [{ OR: [{ technicianId: 10 }, { technicianId: null }] }, expect.objectContaining({ OR: expect.any(Array) })] } }));
  });

  it('atomically rejects a cross-user update', async () => {
    session('IT_SUPPORT', 10);
    prisma.ticket.findUnique.mockResolvedValue({ id: 9, ticketId: 'TKT-9', technicianId: 11, status: 'OPEN', createdAt: new Date(), slaTarget: 8, resolvedAt: null });
    prisma.ticket.updateMany.mockResolvedValue({ count: 0 });
    await request(app).put('/tickets/9').set('Cookie', ['helpdesk_session=x', 'helpdesk_csrf=csrf']).set('X-CSRF-Token', 'csrf').send({ status: 'PENDING' }).expect(403);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });
});

describe('public verification HTTP seam', () => {
  it('rejects failed CAPTCHA without issuing a verification token', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ success: false }) })));
    await request(app).post('/public/verify-employee').send({ employeeCode: '001', turnstileToken: 'bad' }).expect(403);
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });

  it('creates and consumes the public token in one transaction so ticket failure rolls back consumption', async () => {
    prisma.verificationToken.findUnique.mockResolvedValue({ id: 'token', employeeId: 1, consumedAt: null, expiresAt: new Date(Date.now() + 60000) });
    prisma.employee.findUnique.mockResolvedValue({ id: 1, isActive: true, name: 'Budi', department: 'IT' });
    prisma.verificationToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.department.findFirst.mockResolvedValue({ id: 1, name: 'IT' });
    prisma.ticket.create.mockRejectedValue(new Error('database failure'));
    await request(app).post('/public/tickets').send({ verificationToken: 'valid', categoryId: 1, issue: 'Rusak', priority: 'HIGH' }).expect(500);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(prisma.verificationToken.updateMany).toHaveBeenCalled();
  });

  it('rejects missing and consumed ticket verification tokens', async () => {
    prisma.verificationToken.findUnique.mockResolvedValue(null);
    await request(app).post('/public/tickets').send({ verificationToken: 'missing', categoryId: 1, issue: 'Rusak', priority: 'HIGH' }).expect(403);
    prisma.verificationToken.findUnique.mockResolvedValue({ id: 'token', employeeId: 1, consumedAt: new Date(), expiresAt: new Date(Date.now() + 60000) });
    await request(app).post('/public/tickets').send({ verificationToken: 'used', categoryId: 1, issue: 'Rusak', priority: 'HIGH' }).expect(403);
  });
});

describe('import jobs HTTP seam', () => {
  it('persists validated rows and executes by job id without client rows', async () => {
    session('ADMIN');
    prisma.importJob.create.mockResolvedValue({ id: 'job-1', status: 'VALIDATED' });
    const csv = 'requester_name,department,category,issue,priority,satisfaction\nBudi,IT,Hardware,Rusak,HIGH,5\n';
    const response = await request(app).post('/import/jobs').set('Cookie', ['helpdesk_session=x', 'helpdesk_csrf=csrf']).set('X-CSRF-Token', 'csrf').attach('file', Buffer.from(csv), 'tickets.csv').expect(201);
    expect(response.body.data.jobId).toBe('job-1');
    expect(prisma.importJob.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ payload: [expect.objectContaining({ issue: 'Rusak' })] }) }));
  });

  it('recovers only stale processing jobs with an atomic PROCESSING claim', async () => {
    session('ADMIN');
    prisma.importJob.findFirst.mockResolvedValue({ id: 'job-1', userId: 1, status: 'PROCESSING', processingAt: new Date(Date.now() - 20 * 60000), payload: [] });
    prisma.importJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.importJob.update.mockResolvedValue({});
    await request(app).post('/import/jobs/job-1/execute').set('Cookie', ['helpdesk_session=x', 'helpdesk_csrf=csrf']).set('X-CSRF-Token', 'csrf').expect(200);
    expect(prisma.importJob.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'PROCESSING', processingAt: expect.any(Date) } }));
  });

  it('rejects formulas and invalid satisfaction before creating a job', async () => {
    session('ADMIN');
    const csv = 'requester_name,department,category,issue,priority,satisfaction\nBudi,IT,Hardware,=CMD(),HIGH,9\n';
    await request(app).post('/import/jobs').set('Cookie', ['helpdesk_session=x', 'helpdesk_csrf=csrf']).set('X-CSRF-Token', 'csrf').attach('file', Buffer.from(csv), 'tickets.csv').expect(422);
    expect(prisma.importJob.create).not.toHaveBeenCalled();
  });
});
