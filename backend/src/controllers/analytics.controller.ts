import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { DateQuery, parseDateFilter } from '../utils/dateFilter';

const parseFilters = (req: Request, res: Response) => parseDateFilter(req.query as DateQuery, res);

const fail = (res: Response) => res.status(500).json({ success: false, message: 'Data analitik tidak dapat dimuat. Silakan coba lagi.' });

export const getKpi = async (req: Request, res: Response): Promise<void> => {
  const where = parseFilters(req, res);
  if (!where) return;
  try {
    const [total, open, inProgress, pending, resolved, closed, slaMet, slaBreached, avgResolutionData] = await Promise.all([
      prisma.ticket.count({ where }), prisma.ticket.count({ where: { ...where, status: 'OPEN' } }), prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }), prisma.ticket.count({ where: { ...where, status: 'PENDING' } }), prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }), prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }), prisma.ticket.count({ where: { ...where, slaStatus: 'MET' } }), prisma.ticket.count({ where: { ...where, slaStatus: 'BREACHED' } }), prisma.ticket.aggregate({ where: { ...where, resolutionTime: { not: null } }, _avg: { resolutionTime: true } }),
    ]);
    const measured = slaMet + slaBreached;
    res.json({ success: true, data: { totalTickets: total, openTickets: open + inProgress + pending, resolvedTickets: resolved + closed, slaBreached, slaMet, slaCompliance: measured ? Math.round((slaMet / measured) * 1000) / 10 : 0, avgResolutionTime: Math.round((avgResolutionData._avg.resolutionTime || 0) * 10) / 10 } });
  } catch { fail(res); }
};

export const getTicketTrend = async (req: Request, res: Response): Promise<void> => {
  const range = parseFilters(req, res);
  if (!range) return;
  const period = String(req.query.period || 'month');
  if (!['day', 'week', 'month'].includes(period)) {
    res.status(400).json({ success: false, message: 'Periode harus day, week, atau month.' });
    return;
  }
  try {
    let where = range;
    if (!req.query.dateFrom && !req.query.dateTo) {
      const start = new Date();
      if (period === 'day') start.setDate(start.getDate() - 30);
      else if (period === 'week') start.setMonth(start.getMonth() - 3);
      else start.setFullYear(start.getFullYear() - 1);
      where = { createdAt: { gte: start } };
    }
    const tickets = await prisma.ticket.findMany({ where, select: { createdAt: true, status: true }, orderBy: { createdAt: 'asc' } });
    const grouped: Record<string, { total: number; resolved: number }> = {};
    tickets.forEach((ticket) => {
      let key = ticket.createdAt.toISOString().slice(0, 10);
      if (period === 'week') { const start = new Date(ticket.createdAt); start.setUTCDate(start.getUTCDate() - start.getUTCDay()); key = start.toISOString().slice(0, 10); }
      if (period === 'month') key = ticket.createdAt.toISOString().slice(0, 7);
      grouped[key] ||= { total: 0, resolved: 0 };
      grouped[key].total += 1;
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') grouped[key].resolved += 1;
    });
    res.json({ success: true, data: Object.entries(grouped).map(([date, data]) => ({ date, ...data })) });
  } catch { fail(res); }
};

export const getCategoryDistribution = async (req: Request, res: Response): Promise<void> => {
  const where = parseFilters(req, res); if (!where) return;
  try { const [result, categories] = await Promise.all([prisma.ticket.groupBy({ by: ['categoryId'], where, _count: { _all: true } }), prisma.category.findMany()]); const names = Object.fromEntries(categories.map((item) => [item.id, item.name])); res.json({ success: true, data: result.map((item) => ({ category: names[item.categoryId] || 'Unknown', count: item._count._all })) }); } catch { fail(res); }
};

export const getTopIssues = async (req: Request, res: Response): Promise<void> => {
  const where = parseFilters(req, res); if (!where) return;
  const limit = Number(req.query.limit || 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) { res.status(400).json({ success: false, message: 'Limit harus berupa angka 1 sampai 50.' }); return; }
  try { const result = await prisma.ticket.groupBy({ by: ['issue'], where, _count: { _all: true }, orderBy: { _count: { issue: 'desc' } }, take: limit }); res.json({ success: true, data: result.map((item) => ({ issue: item.issue, count: item._count._all })) }); } catch { fail(res); }
};

export const getDepartmentAnalysis = async (req: Request, res: Response): Promise<void> => {
  const where = parseFilters(req, res); if (!where) return;
  try { const [result, departments] = await Promise.all([prisma.ticket.groupBy({ by: ['departmentId'], where, _count: { _all: true }, _avg: { resolutionTime: true } }), prisma.department.findMany()]); const names = Object.fromEntries(departments.map((item) => [item.id, item.name])); res.json({ success: true, data: result.map((item) => ({ department: names[item.departmentId] || 'Unknown', count: item._count._all, avgResolutionTime: Math.round((item._avg.resolutionTime || 0) * 10) / 10 })) }); } catch { fail(res); }
};

export const getTechnicianPerformance = async (req: Request, res: Response): Promise<void> => {
  const dateWhere = parseFilters(req, res); if (!dateWhere) return;
  try { const technicians = await prisma.technician.findMany(); const data = await Promise.all(technicians.map(async (tech) => { const where = { ...dateWhere, technicianId: tech.id }; const [total, resolved, met, breached, avg] = await Promise.all([prisma.ticket.count({ where }), prisma.ticket.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }), prisma.ticket.count({ where: { ...where, slaStatus: 'MET' } }), prisma.ticket.count({ where: { ...where, slaStatus: 'BREACHED' } }), prisma.ticket.aggregate({ where: { ...where, resolutionTime: { not: null } }, _avg: { resolutionTime: true } })]); return { id: tech.id, name: tech.name, email: tech.email, totalTickets: total, resolvedTickets: resolved, slaMet: met, slaBreached: breached, slaCompliance: met + breached ? Math.round((met / (met + breached)) * 1000) / 10 : 0, avgResolutionTime: Math.round((avg._avg.resolutionTime || 0) * 10) / 10 }; })); res.json({ success: true, data }); } catch { fail(res); }
};
