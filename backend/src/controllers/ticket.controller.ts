import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import ExcelJS from 'exceljs';
import { getSlaTarget, calculateResolutionTime, calculateSlaStatus } from '../utils/sla.utils';
import { logActivity } from '../utils/activityLogger';
import { createTicketId } from '../utils/ticketId';

interface TicketQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  priority?: string;
  department?: string;
  technician?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const getTickets = async (req: Request<object, object, object, TicketQuery>, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      category,
      priority,
      department,
      technician,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    const user = (req as Request & { user?: { role: string; technicianId: number | null } }).user;
    if (user?.role === 'IT_SUPPORT') where.AND = [{ OR: [{ technicianId: user.technicianId ?? -1 }, { technicianId: null }] }];

    if (search) {
      const searchClause = { OR: [
        { ticketId: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { issue: { contains: search, mode: 'insensitive' } },
      ] };
      where.AND = [...((where.AND as object[]) || []), searchClause];
    }

    if (category) where.category = { name: { equals: category, mode: 'insensitive' } };
    if (priority) where.priority = priority.toUpperCase();
    if (status) {
      // Support comma-separated multiple status values e.g. "OPEN,IN_PROGRESS,PENDING"
      const statuses = status.toUpperCase().split(',').map((s: string) => s.trim().replace(' ', '_'));
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (department) where.department = { name: { equals: department, mode: 'insensitive' } };
    if (technician) where.technician = { name: { equals: technician, mode: 'insensitive' } };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59');
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      ticketId: 'ticketId',
      priority: 'priority',
      status: 'status',
      resolutionTime: 'resolutionTime',
    };

    const orderBy = { [validSortFields[sortBy] || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc' };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: true,
          subcategory: true,
          department: true,
          technician: true,
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetTickets error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(String(id)) },
      include: {
        category: true,
        subcategory: true,
        department: true,
        technician: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
      return;
    }
    const user = (req as Request & { user?: { role: string; technicianId: number | null } }).user;
    if (user?.role === 'IT_SUPPORT' && ticket.technicianId !== null && ticket.technicianId !== user.technicianId) {
      res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('GetTicketById error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const createTicket = async (req: Request & { user?: { id: number; role: string } }, res: Response): Promise<void> => {
  try {
    const {
      requesterName, departmentId, location,
      categoryId, subcategoryId, issue, description,
      priority, resolutionNotes,
    } = req.body;

    if (!requesterName || !departmentId || !categoryId || !issue || !priority) {
      res.status(400).json({ success: false, message: 'Field wajib tidak lengkap.' });
      return;
    }

    const ticketId = createTicketId();
    const slaTarget = getSlaTarget(priority.toUpperCase());

    // Auto-assign technician based on who is logged in
    let resolvedTechnicianId: number | null = null;
    if (req.user?.role === 'IT_SUPPORT') {
      // Find the technician linked to this user account
      const userWithTech = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { technicianId: true },
      });
      resolvedTechnicianId = userWithTech?.technicianId ?? null;
    }
    // Admin/Manager → Belum Diassign (null)

    const ticket = await prisma.ticket.create({
      data: {
        ticketId,
        requesterName,
        departmentId: parseInt(departmentId),
        location,
        categoryId: parseInt(categoryId),
        subcategoryId: subcategoryId ? parseInt(subcategoryId) : null,
        issue,
        description,
        priority: priority.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        status: 'OPEN',
        technicianId: resolvedTechnicianId,
        slaTarget,
        slaStatus: 'PENDING',
        resolutionNotes,
      },
      include: {
        category: true,
        subcategory: true,
        department: true,
        technician: true,
      },
    });

    if (req.user) {
      await logActivity(req.user.id, 'CREATE_TICKET', `Membuat tiket baru ${ticketId}`, { ticketId: ticket.id }, req.ip);
    }

    res.status(201).json({ success: true, message: 'Tiket berhasil dibuat.', data: ticket });
  } catch (error) {
    console.error('CreateTicket error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const updateTicket = async (req: Request & { user?: { id: number; role: string; technicianId: number | null } }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status, technicianId, resolutionNotes,
      priority, categoryId, subcategoryId, issue, description,
      satisfaction,
    } = req.body;

    const existingTicket = await prisma.ticket.findUnique({ where: { id: parseInt(String(id)) } });

    if (!existingTicket) {
      res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
      return;
    }

    if (req.user?.role === 'IT_SUPPORT' && !req.user.technicianId) {
      res.status(403).json({ success: false, message: 'Akun teknisi belum terhubung.' });
      return;
    }

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status.toUpperCase().replace(' ', '_');
    if (technicianId !== undefined) updateData.technicianId = technicianId ? parseInt(technicianId) : null;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (priority) {
      updateData.priority = priority.toUpperCase();
      updateData.slaTarget = getSlaTarget(priority.toUpperCase());
    }
    if (categoryId) updateData.categoryId = parseInt(categoryId);
    if (subcategoryId !== undefined) updateData.subcategoryId = subcategoryId ? parseInt(subcategoryId) : null;
    if (issue) updateData.issue = issue;
    if (description !== undefined) updateData.description = description;
    if (satisfaction !== undefined) updateData.satisfaction = parseInt(satisfaction);

    // Handle resolution
    const newStatus = (status || existingTicket.status) as string;
    if ((newStatus === 'RESOLVED' || newStatus === 'CLOSED') && !existingTicket.resolvedAt) {
      const resolvedAt = new Date();
      updateData.resolvedAt = resolvedAt;
      const resolutionTime = calculateResolutionTime(existingTicket.createdAt, resolvedAt);
      updateData.resolutionTime = resolutionTime;
      updateData.slaStatus = calculateSlaStatus(resolutionTime, existingTicket.slaTarget, newStatus);
    }

    // Auto-assign technician when IT_SUPPORT updates a ticket
    if (req.user?.role === 'IT_SUPPORT') {
      updateData.technicianId = req.user.technicianId;
      const claimed = await prisma.ticket.updateMany({
        where: { id: parseInt(String(id)), OR: [{ technicianId: null }, { technicianId: req.user.technicianId }] },
        data: updateData,
      });
      if (claimed.count !== 1) {
        res.status(403).json({ success: false, message: 'Akses ditolak. Tiket ditangani teknisi lain.' });
        return;
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: parseInt(String(id)) },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
        department: true,
        technician: true,
      },
    });

    if (req.user) {
      const statusText = status ? ` status → ${status.toUpperCase().replace(' ', '_')}` : '';
      await logActivity(req.user.id, 'UPDATE_TICKET', `Update tiket ${existingTicket.ticketId}${statusText}`, { ticketId: existingTicket.id, updates: updateData }, req.ip);
    }

    res.json({ success: true, message: 'Tiket berhasil diupdate.', data: updated });
  } catch (error) {
    console.error('UpdateTicket error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const deleteTicket = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existingTicket = await prisma.ticket.findUnique({ where: { id: parseInt(String(id)) } });
    if (existingTicket) {
      await prisma.ticket.delete({ where: { id: parseInt(String(id)) } });
      if (req.user) {
        await logActivity(req.user.id, 'DELETE_TICKET', `Menghapus tiket ${existingTicket.ticketId}`, { ticketId: existingTicket.id }, req.ip);
      }
    }
    res.json({ success: true, message: 'Tiket berhasil dihapus.' });
  } catch (error) {
    console.error('DeleteTicket error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const exportTickets = async (req: Request<object, object, object, TicketQuery>, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      category,
      priority,
      department,
      technician,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { ticketId: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { issue: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = { name: { equals: category, mode: 'insensitive' } };
    if (priority) where.priority = priority.toUpperCase();
    if (status) {
      const statuses = status.toUpperCase().split(',').map((s: string) => s.trim().replace(' ', '_'));
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (department) where.department = { name: { equals: department, mode: 'insensitive' } };
    if (technician) where.technician = { name: { equals: technician, mode: 'insensitive' } };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59');
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      ticketId: 'ticketId',
      priority: 'priority',
      status: 'status',
      resolutionTime: 'resolutionTime',
    };

    const orderBy = { [validSortFields[sortBy] || 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc' };

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy,
      include: { category: true, subcategory: true, department: true, technician: true },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Tiket');

    sheet.columns = [
      { header: 'ID Tiket', key: 'ticketId', width: 15 },
      { header: 'Tanggal Dibuat', key: 'createdAt', width: 22 },
      { header: 'Requester', key: 'requesterName', width: 20 },
      { header: 'Departemen', key: 'department', width: 15 },
      { header: 'Lokasi', key: 'location', width: 20 },
      { header: 'Kategori', key: 'category', width: 15 },
      { header: 'Subkategori', key: 'subcategory', width: 15 },
      { header: 'Keluhan', key: 'issue', width: 35 },
      { header: 'Prioritas', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Teknisi', key: 'technician', width: 20 },
      { header: 'Resolution Time (jam)', key: 'resolutionTime', width: 22 },
      { header: 'SLA Target (jam)', key: 'slaTarget', width: 18 },
      { header: 'Tanggal Selesai', key: 'resolvedAt', width: 22 },
      { header: 'Status SLA', key: 'slaStatus', width: 15 },
    ];

    // Header style
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    const formatDate = (date: Date) => {
      return date.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    };

    tickets.forEach((t) => {
      const row = sheet.addRow({
        ticketId: t.ticketId,
        createdAt: formatDate(t.createdAt),
        requesterName: t.requesterName,
        department: (t as any).department?.name || '-',
        location: t.location || '-',
        category: (t as any).category?.name || '-',
        subcategory: (t as any).subcategory?.name || '-',
        issue: t.issue,
        priority: t.priority,
        status: t.status,
        technician: (t as any).technician?.name || '-',
        resolutionTime: t.resolutionTime || '',
        slaTarget: t.slaTarget,
        resolvedAt: t.resolvedAt ? formatDate(t.resolvedAt) : '',
        slaStatus: t.slaStatus,
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=data-tiket.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('ExportTickets error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor tiket.' });
  }
};
