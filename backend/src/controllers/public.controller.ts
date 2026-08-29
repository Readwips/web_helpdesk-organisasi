import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getSlaTarget } from '../utils/sla.utils';
import { hashToken, randomToken } from '../lib/security';
import { createTicketId } from '../utils/ticketId';

// POST /api/public/verify-employee
export const verifyEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeCode, turnstileToken } = req.body;

    if (!employeeCode || !turnstileToken) {
      res.status(400).json({ success: false, message: 'Nomor pegawai wajib diisi.' });
      return;
    }

    const captcha = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY || '', response: String(turnstileToken), remoteip: req.ip || '' }),
    }).then((response) => response.json()) as { success?: boolean };
    if (!captcha.success) {
      res.status(403).json({ success: false, message: 'Verifikasi CAPTCHA gagal.' });
      return;
    }
    const code = String(employeeCode).padStart(3, '0');

    const employee = await prisma.employee.findUnique({
      where: { employeeCode: code },
    });

    if (!employee || !employee.isActive) {
      res.status(403).json({ success: false, message: 'Nomor pegawai tidak valid.' });
      return;
    }

    const verificationToken = randomToken();
    await prisma.verificationToken.create({ data: { employeeId: employee.id, tokenHash: hashToken(verificationToken), expiresAt: new Date(Date.now() + 10 * 60000) } });
    res.json({
      success: true,
      data: {
        verificationToken,
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        department: employee.department,
        position: employee.position,
      },
    });
  } catch (error) {
    console.error('VerifyEmployee error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// POST /api/public/tickets
export const createPublicTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { verificationToken, categoryId, subcategoryId, issue, description, priority, location } = req.body;

    if (!verificationToken || !categoryId || !issue || !priority) {
      res.status(400).json({ success: false, message: 'Field wajib tidak lengkap.' });
      return;
    }

    const token = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(String(verificationToken)) } });
    if (!token || token.consumedAt || token.expiresAt <= new Date()) {
      res.status(403).json({ success: false, message: 'Token verifikasi tidak valid.' });
      return;
    }
    const employee = await prisma.employee.findUnique({ where: { id: token.employeeId } });
    if (!employee || !employee.isActive) {
      res.status(403).json({ success: false, message: 'Nomor pegawai tidak valid.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const consumed = await tx.verificationToken.updateMany({ where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
      if (consumed.count !== 1) throw new Error('TOKEN_CONSUMED');
      let department = await tx.department.findFirst({ where: { name: { equals: employee.department, mode: 'insensitive' } } });
      if (!department) department = await tx.department.create({ data: { name: employee.department } });
      const ticket = await tx.ticket.create({ data: { ticketId: createTicketId(), requesterName: employee.name, departmentId: department.id, location: location || null, categoryId: parseInt(categoryId), subcategoryId: subcategoryId ? parseInt(subcategoryId) : null, issue, description: description || null, priority: priority.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', status: 'OPEN', technicianId: null, slaTarget: getSlaTarget(priority.toUpperCase()), slaStatus: 'PENDING' }, include: { category: true, department: true } });
      return { department, ticket };
    });
    const { department, ticket } = result;

    // Notify all IT_SUPPORT and ADMIN users
    const supportUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'IT_SUPPORT'] } },
      select: { id: true }
    });

    if (supportUsers.length > 0) {
      await prisma.notification.createMany({
        data: supportUsers.map(u => ({
          userId: u.id,
          title: `Tiket Baru: ${ticket.ticketId}`,
          message: `${employee.name} dari ${department.name} melaporkan: ${ticket.issue}`,
          link: '/tiket'
        }))
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat. Catat nomor tiket Anda.',
      data: {
        ticketId: ticket.ticketId,
        issue: ticket.issue,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error('CreatePublicTicket error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// GET /api/public/categories
export const getPublicCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
