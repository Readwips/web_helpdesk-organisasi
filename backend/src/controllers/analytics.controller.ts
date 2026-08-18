import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getKpi = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) dateFilter.lte = new Date((dateTo as string) + 'T23:59:59');
    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
      total,
      open,
      inProgress,
      pending,
      resolved,
      closed,
      slaMet,
      slaBreached,
      avgResolutionData,
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...where, status: 'PENDING' } }),
      prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }),
      prisma.ticket.count({ where: { ...where, slaStatus: 'MET' } }),
      prisma.ticket.count({ where: { ...where, slaStatus: 'BREACHED' } }),
      prisma.ticket.aggregate({
        where: { ...where, resolutionTime: { not: null } },
        _avg: { resolutionTime: true },
      }),
    ]);

    const totalResolved = slaMet + slaBreached;
    const slaCompliance = totalResolved > 0 ? Math.round((slaMet / totalResolved) * 1000) / 10 : 0;
    const avgResolutionTime = Math.round((avgResolutionData._avg.resolutionTime || 0) * 10) / 10;

    res.json({
      success: true,
      data: {
        totalTickets: total,
        openTickets: open + inProgress + pending,
        resolvedTickets: resolved + closed,
        slaBreached,
        slaMet,
        slaCompliance,
        avgResolutionTime,
      },
    });
  } catch (error) {
    console.error('GetKpi error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getTicketTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query as { period?: string };

    let startDate: Date;
    const now = new Date();

    if (period === 'day') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { total: number; resolved: number }> = {};
    tickets.forEach((t) => {
      let key: string;
      if (period === 'day') {
        key = t.createdAt.toISOString().split('T')[0];
      } else if (period === 'week') {
        const d = new Date(t.createdAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = { total: 0, resolved: 0 };
      grouped[key].total++;
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') grouped[key].resolved++;
    });

    const trend = Object.entries(grouped).map(([date, data]) => ({ date, ...data }));

    res.json({ success: true, data: trend });
  } catch (error) {
    console.error('GetTicketTrend error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getCategoryDistribution = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.ticket.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
    });

    const categories = await prisma.category.findMany();
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const data = result.map((r) => ({
      category: catMap[r.categoryId] || 'Unknown',
      count: r._count._all,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetCategoryDistribution error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getTopIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query as { limit?: string };

    const result = await prisma.ticket.groupBy({
      by: ['issue'],
      _count: { _all: true },
      orderBy: { _count: { issue: 'desc' } },
      take: parseInt(limit),
    });

    const data = result.map((r) => ({
      issue: r.issue,
      count: r._count._all,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetTopIssues error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getDepartmentAnalysis = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.ticket.groupBy({
      by: ['departmentId'],
      _count: { _all: true },
      _avg: { resolutionTime: true },
    });

    const departments = await prisma.department.findMany();
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const data = result.map((r) => ({
      department: deptMap[r.departmentId] || 'Unknown',
      count: r._count._all,
      avgResolutionTime: Math.round((r._avg.resolutionTime || 0) * 10) / 10,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetDepartmentAnalysis error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getTechnicianPerformance = async (_req: Request, res: Response): Promise<void> => {
  try {
    const technicians = await prisma.technician.findMany();

    const data = await Promise.all(
      technicians.map(async (tech) => {
        const [total, resolved, slaMet, slaBreached, avgRes] = await Promise.all([
          prisma.ticket.count({ where: { technicianId: tech.id } }),
          prisma.ticket.count({ where: { technicianId: tech.id, status: { in: ['RESOLVED', 'CLOSED'] } } }),
          prisma.ticket.count({ where: { technicianId: tech.id, slaStatus: 'MET' } }),
          prisma.ticket.count({ where: { technicianId: tech.id, slaStatus: 'BREACHED' } }),
          prisma.ticket.aggregate({
            where: { technicianId: tech.id, resolutionTime: { not: null } },
            _avg: { resolutionTime: true },
          }),
        ]);

        const slaCompliance = slaMet + slaBreached > 0
          ? Math.round((slaMet / (slaMet + slaBreached)) * 1000) / 10
          : 0;

        return {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          totalTickets: total,
          resolvedTickets: resolved,
          slaMet,
          slaBreached,
          slaCompliance,
          avgResolutionTime: Math.round((avgRes._avg.resolutionTime || 0) * 10) / 10,
        };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetTechnicianPerformance error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
