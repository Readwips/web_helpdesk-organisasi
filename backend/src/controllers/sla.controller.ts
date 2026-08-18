import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getSlaSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, met, breached, avgResData, avgBreachData] = await Promise.all([
      prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.ticket.count({ where: { slaStatus: 'MET' } }),
      prisma.ticket.count({ where: { slaStatus: 'BREACHED' } }),
      prisma.ticket.aggregate({
        where: { resolutionTime: { not: null } },
        _avg: { resolutionTime: true },
      }),
      prisma.ticket.findMany({
        where: { slaStatus: 'BREACHED' },
        select: { resolutionTime: true, slaTarget: true },
      }),
    ]);

    const slaCompliance = total > 0 ? Math.round(((met) / total) * 1000) / 10 : 0;
    const avgBreachTime = avgBreachData.length > 0
      ? Math.round(
          (avgBreachData.reduce((acc, t) => acc + ((t.resolutionTime || 0) - t.slaTarget), 0) / avgBreachData.length) * 10
        ) / 10
      : 0;

    res.json({
      success: true,
      data: {
        totalResolved: total,
        slaMet: met,
        slaBreached: breached,
        slaCompliance,
        avgResolutionTime: Math.round((avgResData._avg.resolutionTime || 0) * 10) / 10,
        avgBreachTime,
      },
    });
  } catch (error) {
    console.error('GetSlaSummary error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getSlaByPriority = async (_req: Request, res: Response): Promise<void> => {
  try {
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    const data = await Promise.all(
      priorities.map(async (priority) => {
        const [met, breached, total] = await Promise.all([
          prisma.ticket.count({ where: { priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', slaStatus: 'MET' } }),
          prisma.ticket.count({ where: { priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', slaStatus: 'BREACHED' } }),
          prisma.ticket.count({ where: { priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' } }),
        ]);

        const compliance = met + breached > 0 ? Math.round((met / (met + breached)) * 1000) / 10 : 0;

        return { priority, met, breached, total, compliance };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetSlaByPriority error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getSlaByCategory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany();

    const data = await Promise.all(
      categories.map(async (cat) => {
        const [met, breached] = await Promise.all([
          prisma.ticket.count({ where: { categoryId: cat.id, slaStatus: 'MET' } }),
          prisma.ticket.count({ where: { categoryId: cat.id, slaStatus: 'BREACHED' } }),
        ]);
        const compliance = met + breached > 0 ? Math.round((met / (met + breached)) * 1000) / 10 : 0;
        return { category: cat.name, met, breached, compliance };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetSlaByCategory error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getSlaByTechnician = async (_req: Request, res: Response): Promise<void> => {
  try {
    const technicians = await prisma.technician.findMany();

    const data = await Promise.all(
      technicians.map(async (tech) => {
        const [met, breached] = await Promise.all([
          prisma.ticket.count({ where: { technicianId: tech.id, slaStatus: 'MET' } }),
          prisma.ticket.count({ where: { technicianId: tech.id, slaStatus: 'BREACHED' } }),
        ]);
        const compliance = met + breached > 0 ? Math.round((met / (met + breached)) * 1000) / 10 : 0;
        return { technician: tech.name, met, breached, compliance };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('GetSlaByTechnician error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getSlaBreachedTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { slaStatus: 'BREACHED' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { category: true, department: true, technician: true },
      }),
      prisma.ticket.count({ where: { slaStatus: 'BREACHED' } }),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('GetSlaBreachedTickets error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
