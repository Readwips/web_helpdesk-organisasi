import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getSlaTarget } from '../utils/sla.utils';

// POST /api/public/verify-employee
export const verifyEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeCode } = req.body;

    if (!employeeCode) {
      res.status(400).json({ success: false, message: 'Nomor pegawai wajib diisi.' });
      return;
    }

    // Pad to 3 digits if numeric
    const code = String(employeeCode).padStart(3, '0');

    const employee = await prisma.employee.findUnique({
      where: { employeeCode: code },
    });

    if (!employee) {
      res.status(404).json({ success: false, message: 'Nomor pegawai tidak ditemukan. Hubungi Admin jika ada kesalahan.' });
      return;
    }

    if (!employee.isActive) {
      res.status(403).json({ success: false, message: 'Akun pegawai ini sudah tidak aktif.' });
      return;
    }

    res.json({
      success: true,
      data: {
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
    const { employeeCode, categoryId, subcategoryId, issue, description, priority, location } = req.body;

    if (!employeeCode || !categoryId || !issue || !priority) {
      res.status(400).json({ success: false, message: 'Field wajib tidak lengkap.' });
      return;
    }

    const code = String(employeeCode).padStart(3, '0');

    // Re-verify employee
    const employee = await prisma.employee.findUnique({ where: { employeeCode: code } });
    if (!employee || !employee.isActive) {
      res.status(403).json({ success: false, message: 'Nomor pegawai tidak valid.' });
      return;
    }

    // Get or create department by employee department name
    let department = await prisma.department.findFirst({
      where: { name: { equals: employee.department, mode: 'insensitive' } },
    });
    if (!department) {
      department = await prisma.department.create({ data: { name: employee.department } });
    }

    const count = await prisma.ticket.count();
    const ticketId = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const slaTarget = getSlaTarget(priority.toUpperCase());

    const ticket = await prisma.ticket.create({
      data: {
        ticketId,
        requesterName: employee.name,
        departmentId: department.id,
        location: location || null,
        categoryId: parseInt(categoryId),
        subcategoryId: subcategoryId ? parseInt(subcategoryId) : null,
        issue,
        description: description || null,
        priority: priority.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        status: 'OPEN',
        technicianId: null,
        slaTarget,
        slaStatus: 'PENDING',
      },
      include: {
        category: true,
        department: true,
      },
    });

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
