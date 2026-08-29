import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const prisma = vi.hoisted(() => ({
  ticket: { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
  category: { findMany: vi.fn() },
  department: { findMany: vi.fn() },
  technician: { findMany: vi.fn() },
}));
vi.mock('../src/lib/prisma', () => ({ default: prisma }));

import { getKpi } from '../src/controllers/analytics.controller';
import { getSlaBreachedTickets } from '../src/controllers/sla.controller';
import { requestLogger } from '../src/middleware/requestLogger';
import { logger } from '../src/lib/logger';

const analyticsApp = express();
analyticsApp.get('/analytics/kpi', getKpi);

const slaApp = express();
slaApp.get('/sla/breached', getSlaBreachedTickets);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  prisma.ticket.count.mockResolvedValue(0);
  prisma.ticket.aggregate.mockResolvedValue({ _avg: { resolutionTime: null } });
  prisma.ticket.findMany.mockResolvedValue([]);
});

describe('analytics date filters', () => {
  it('rejects impossible calendar dates before querying', async () => {
    await request(analyticsApp).get('/analytics/kpi?dateFrom=2026-02-31').expect(400);
    expect(prisma.ticket.count).not.toHaveBeenCalled();
  });

  it('rejects a reversed date range', async () => {
    await request(analyticsApp).get('/analytics/kpi?dateFrom=2026-03-02&dateTo=2026-03-01').expect(400);
    expect(prisma.ticket.count).not.toHaveBeenCalled();
  });

  it('applies inclusive UTC boundaries to analytics queries', async () => {
    await request(analyticsApp).get('/analytics/kpi?dateFrom=2026-02-01&dateTo=2026-02-28').expect(200);
    expect(prisma.ticket.count).toHaveBeenCalledWith({ where: { createdAt: { gte: new Date('2026-02-01T00:00:00.000Z'), lte: new Date('2026-02-28T23:59:59.999Z') } } });
  });

  it('applies the same date range to breached SLA tickets and count', async () => {
    await request(slaApp).get('/sla/breached?page=1&limit=8&dateFrom=2026-02-01&dateTo=2026-02-28').expect(200);
    const where = { createdAt: { gte: new Date('2026-02-01T00:00:00.000Z'), lte: new Date('2026-02-28T23:59:59.999Z') }, slaStatus: 'BREACHED' };
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(prisma.ticket.count).toHaveBeenCalledWith({ where });
  });
});

describe('structured request logging', () => {
  it('preserves valid request IDs and emits request metadata', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const app = express();
    app.use(requestLogger);
    app.get('/health', (_req, res) => res.sendStatus(204));
    const response = await request(app).get('/health').set('x-request-id', 'review-123').expect(204);
    expect(response.headers['x-request-id']).toBe('review-123');
    expect(info).toHaveBeenCalledWith('http_request', expect.objectContaining({ requestId: 'review-123', method: 'GET', path: '/health', status: 204, durationMs: expect.any(Number) }));
  });

  it('redacts nested secrets in JSON logs', () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.info('redaction_test', { password: 'hidden', nested: { authorization: 'Bearer secret', safe: 'visible' } });
    const payload = JSON.parse(String(output.mock.calls[0][0]));
    expect(payload).toMatchObject({ password: '[REDACTED]', nested: { authorization: '[REDACTED]', safe: 'visible' } });
  });
});
