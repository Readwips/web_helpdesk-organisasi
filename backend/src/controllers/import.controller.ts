import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import csvParser from 'csv-parser';
import ExcelJS from 'exceljs';
import prisma from '../lib/prisma';
import { getSlaTarget, calculateResolutionTime, calculateSlaStatus } from '../utils/sla.utils';
import { logActivity } from '../utils/activityLogger';

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Hanya file CSV dan Excel yang diperbolehkan.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

interface ImportRow {
  requester_name?: string;
  department?: string;
  location?: string;
  category?: string;
  subcategory?: string;
  issue?: string;
  description?: string;
  priority?: string;
  status?: string;
  technician?: string;
  created_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  satisfaction?: string;
  [key: string]: string | undefined;
}

const normalizeCategory = (name: string): string => {
  if (!name) return '';
  return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
};

const normalizePriority = (p: string): string => {
  const map: Record<string, string> = {
    critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW',
    tinggi: 'HIGH', sedang: 'MEDIUM', rendah: 'LOW', kritis: 'CRITICAL',
  };
  return map[p?.toLowerCase()] || 'MEDIUM';
};

const normalizeStatus = (s: string): string => {
  const map: Record<string, string> = {
    open: 'OPEN', 'in progress': 'IN_PROGRESS', in_progress: 'IN_PROGRESS',
    pending: 'PENDING', resolved: 'RESOLVED', closed: 'CLOSED',
  };
  return map[s?.toLowerCase()] || 'OPEN';
};

const parseRows = (rawRows: ImportRow[]) => {
  const validRows: ImportRow[] = [];
  const invalidRows: { row: number; reason: string }[] = [];
  const ticketIds = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const errors: string[] = [];

    if (!row.requester_name?.trim()) errors.push('requester_name kosong');
    if (!row.issue?.trim()) errors.push('issue kosong');
    if (!row.category?.trim()) errors.push('category kosong');
    if (!row.department?.trim()) errors.push('department kosong');
    if (!['critical', 'high', 'medium', 'low'].includes(row.priority?.toLowerCase() || '')) {
      errors.push('priority tidak valid');
    }

    if (errors.length > 0) {
      invalidRows.push({ row: rowNum, reason: errors.join(', ') });
    } else {
      validRows.push(row);
    }
  });

  // Deduplicate by issue + requester + date
  const seen = new Set<string>();
  const deduped = validRows.filter((row) => {
    const key = `${row.requester_name}-${row.issue}-${row.created_at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    validRows: deduped,
    invalidRows,
    totalRows: rawRows.length,
    validCount: deduped.length,
    invalidCount: invalidRows.length,
    duplicateCount: validRows.length - deduped.length,
  };
};

export const validateImport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
      return;
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let rawRows: ImportRow[] = [];

    if (ext === '.csv') {
      rawRows = await new Promise((resolve, reject) => {
        const rows: ImportRow[] = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => rows.push(row as ImportRow))
          .on('end', () => resolve(rows))
          .on('error', reject);
      });
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => headers.push(String(cell.value || '').toLowerCase().replace(/ /g, '_')));
        } else {
          const rowData: ImportRow = {};
          row.eachCell((cell, colNumber) => {
            if (headers[colNumber - 1]) {
              rowData[headers[colNumber - 1]] = String(cell.value || '');
            }
          });
          rawRows.push(rowData);
        }
      });
    }

    const result = parseRows(rawRows);
    const preview = result.validRows.slice(0, 10);

    // Cleanup file after reading
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        ...result,
        preview,
        rawRows: result.validRows,
      },
    });
  } catch (error) {
    console.error('ValidateImport error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses file.' });
  }
};

export const executeImport = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { rows } = req.body as { rows: ImportRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'Tidak ada data untuk diimport.' });
      return;
    }

    // Get or create master data
    const getOrCreate = async (model: 'category' | 'department', name: string): Promise<number> => {
      const normalizedName = normalizeCategory(name);
      let record;
      if (model === 'category') {
        record = await prisma.category.upsert({
          where: { name: normalizedName },
          update: {},
          create: { name: normalizedName },
        });
      } else {
        record = await prisma.department.upsert({
          where: { name: normalizedName },
          update: {},
          create: { name: normalizedName },
        });
      }
      return record.id;
    };

    let imported = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const categoryId = await getOrCreate('category', row.category || 'Other');
        const departmentId = await getOrCreate('department', row.department || 'General');

        // Find technician
        let technicianId = null;
        if (row.technician) {
          const tech = await prisma.technician.findFirst({
            where: { name: { contains: row.technician, mode: 'insensitive' } },
          });
          if (tech) technicianId = tech.id;
        }

        const count = await prisma.ticket.count();
        const ticketId = `TKT-IMP-${String(count + 1).padStart(5, '0')}`;

        const priority = normalizePriority(row.priority || 'MEDIUM');
        const status = normalizeStatus(row.status || 'OPEN');
        const slaTarget = getSlaTarget(priority);

        const createdAt = row.created_at ? new Date(row.created_at) : new Date();
        const resolvedAt = row.resolved_at ? new Date(row.resolved_at) : null;

        let resolutionTime = null;
        let slaStatus = 'PENDING';

        if (resolvedAt && (status === 'RESOLVED' || status === 'CLOSED')) {
          resolutionTime = calculateResolutionTime(createdAt, resolvedAt);
          slaStatus = calculateSlaStatus(resolutionTime, slaTarget, status);
        }

        await prisma.ticket.create({
          data: {
            ticketId,
            requesterName: row.requester_name || 'Unknown',
            departmentId,
            location: row.location || null,
            categoryId,
            issue: row.issue || 'No issue specified',
            description: row.description || null,
            priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
            status: status as 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED',
            technicianId,
            slaTarget,
            resolutionTime,
            slaStatus: slaStatus as 'MET' | 'BREACHED' | 'PENDING',
            resolutionNotes: row.resolution_notes || null,
            satisfaction: row.satisfaction ? parseInt(row.satisfaction) : null,
            createdAt,
            resolvedAt,
          },
        });

        imported++;
      } catch {
        failed++;
      }
    }

    if (req.user && imported > 0) {
      await logActivity(req.user.id, 'IMPORT_DATA', `Mengimpor ${imported} data tiket`, { imported, failed }, req.ip);
    }

    res.json({
      success: true,
      message: `Import selesai: ${imported} berhasil, ${failed} gagal.`,
      data: { imported, failed },
    });
  } catch (error) {
    console.error('ExecuteImport error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengimport data.' });
  }
};

export const downloadTemplate = async (_req: Request, res: Response): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IT Helpdesk System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Template Import');

    // Header style
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FF000000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }, // Light gray background
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      },
    };

    // Columns setup
    sheet.columns = [
      { header: 'requester_name', key: 'requester_name', width: 20 },
      { header: 'department', key: 'department', width: 15 },
      { header: 'category', key: 'category', width: 15 },
      { header: 'subcategory', key: 'subcategory', width: 15 },
      { header: 'issue', key: 'issue', width: 30 },
      { header: 'description', key: 'description', width: 35 },
      { header: 'priority', key: 'priority', width: 12 },
      { header: 'status', key: 'status', width: 14 },
      { header: 'technician', key: 'technician', width: 20 },
      { header: 'created_at', key: 'created_at', width: 20 },
      { header: 'resolved_at', key: 'resolved_at', width: 20 },
      { header: 'resolution_notes', key: 'resolution_notes', width: 30 },
      { header: 'satisfaction', key: 'satisfaction', width: 15 },
    ];

    // Apply header style
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });
    sheet.getRow(1).height = 25;

    // Add example row
    const exampleRow = sheet.addRow({
      requester_name: 'Budi Santoso',
      department: 'IT',
      category: 'Hardware',
      subcategory: 'Laptop',
      issue: 'Laptop tidak bisa menyala',
      description: 'Sudah dicoba restart tapi tidak bisa',
      priority: 'HIGH',
      status: 'RESOLVED',
      technician: 'Andi Wijaya',
      created_at: '2026-01-10',
      resolved_at: '2026-01-11',
      resolution_notes: 'Ganti baterai',
      satisfaction: '5',
    });

    // Apply borders to example row
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
    exampleRow.eachCell((cell) => {
      cell.border = borderStyle;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=template-import-tiket.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('DownloadTemplate error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat template.' });
  }
};

