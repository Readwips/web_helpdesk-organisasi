import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../lib/prisma';

export const getReportSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59');
    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [total, open, resolved, slaMet, slaBreached, avgRes] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] } } }),
      prisma.ticket.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.ticket.count({ where: { ...where, slaStatus: 'MET' } }),
      prisma.ticket.count({ where: { ...where, slaStatus: 'BREACHED' } }),
      prisma.ticket.aggregate({
        where: { ...where, resolutionTime: { not: null } },
        _avg: { resolutionTime: true },
      }),
    ]);

    const slaCompliance = slaMet + slaBreached > 0
      ? Math.round((slaMet / (slaMet + slaBreached)) * 1000) / 10
      : 0;

    res.json({
      success: true,
      data: {
        period: { from: dateFrom || null, to: dateTo || null },
        totalTickets: total,
        openTickets: open,
        resolvedTickets: resolved,
        slaMet,
        slaBreached,
        slaCompliance,
        avgResolutionTime: Math.round((avgRes._avg.resolutionTime || 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error('GetReportSummary error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const exportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59');
    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true, subcategory: true, department: true, technician: true },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IT Helpdesk System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Laporan Tiket');

    // Header style
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      },
    };

    sheet.columns = [
      { header: 'Ticket ID', key: 'ticketId', width: 18 },
      { header: 'Tanggal Dibuat', key: 'createdAt', width: 20 },
      { header: 'Requester', key: 'requester', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Kategori', key: 'category', width: 15 },
      { header: 'Issue', key: 'issue', width: 30 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Teknisi', key: 'technician', width: 15 },
      { header: 'Resolution Time (jam)', key: 'resolutionTime', width: 22 },
      { header: 'SLA Target (jam)', key: 'slaTarget', width: 18 },
      { header: 'SLA Status', key: 'slaStatus', width: 14 },
      { header: 'Tanggal Resolved', key: 'resolvedAt', width: 20 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });
    sheet.getRow(1).height = 30;

    tickets.forEach((ticket) => {
      sheet.addRow({
        ticketId: ticket.ticketId,
        createdAt: ticket.createdAt.toLocaleDateString('id-ID'),
        requester: ticket.requesterName,
        department: ticket.department?.name || '-',
        category: ticket.category?.name || '-',
        issue: ticket.issue,
        priority: ticket.priority,
        status: ticket.status.replace('_', ' '),
        technician: ticket.technician?.name || '-',
        resolutionTime: ticket.resolutionTime || '-',
        slaTarget: ticket.slaTarget,
        slaStatus: ticket.slaStatus,
        resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toLocaleDateString('id-ID') : '-',
      });
    });

    // Add summary row
    sheet.addRow([]);
    const summaryRow = sheet.addRow(['Total Tiket:', tickets.length]);
    summaryRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-tiket-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('ExportExcel error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data.' });
  }
};
