import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { getSlaTarget, calculateResolutionTime, calculateSlaStatus } from '../utils/sla.utils';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../utils/activityLogger';
import { createTicketId } from '../utils/ticketId';

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (/^\.(csv|xlsx)$/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Hanya file CSV dan Excel yang diperbolehkan.'));
  },
  limits: { fileSize: Number(process.env.IMPORT_MAX_BYTES || 5 * 1024 * 1024), files: 1 },
});

type ImportRow = Record<string, string>;
const required = ['requester_name', 'department', 'category', 'issue', 'priority'];
const allowed = new Set([...required, 'location', 'subcategory', 'description', 'status', 'technician', 'created_at', 'resolved_at', 'resolution_notes', 'satisfaction']);
const limits: Record<string, number> = { requester_name: 100, department: 100, location: 100, category: 50, subcategory: 100, issue: 200, description: 5000, priority: 20, status: 20, technician: 100, created_at: 30, resolved_at: 30, resolution_notes: 5000, satisfaction: 1 };
const priorities = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const statuses = new Set(['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']);

const dateValue = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const validateRows = (rows: ImportRow[], headers: string[]) => {
  const errors: { row: number; reason: string }[] = [];
  const validRows: ImportRow[] = [];
  const duplicates = new Set<string>();
  const seen = new Set<string>();
  if (rows.length > Number(process.env.IMPORT_MAX_ROWS || 1000)) errors.push({ row: 1, reason: 'Maksimal 1000 baris.' });
  const unknown = headers.filter((header) => !allowed.has(header));
  const missing = required.filter((header) => !headers.includes(header));
  if (unknown.length) errors.push({ row: 1, reason: `Kolom tidak dikenal: ${unknown.join(', ')}` });
  if (missing.length) errors.push({ row: 1, reason: `Kolom wajib tidak ada: ${missing.join(', ')}` });
  rows.forEach((source, index) => {
    const row = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, String(value).trim()]));
    const reasons: string[] = [];
    required.forEach((field) => { if (!row[field]) reasons.push(`${field} kosong`); });
    Object.entries(row).forEach(([field, value]) => {
      if ((limits[field] ?? 0) < value.length) reasons.push(`${field} terlalu panjang`);
      if (/^[=+\-@]/.test(value)) reasons.push(`${field} mengandung formula`);
    });
    row.priority = row.priority?.toUpperCase();
    row.status = (row.status || 'OPEN').toUpperCase().replace(/ /g, '_');
    if (!priorities.has(row.priority)) reasons.push('priority tidak valid');
    if (!statuses.has(row.status)) reasons.push('status tidak valid');
    if (row.created_at && !dateValue(row.created_at)) reasons.push('created_at tidak valid');
    if (row.resolved_at && !dateValue(row.resolved_at)) reasons.push('resolved_at tidak valid');
    if (row.resolved_at && !row.created_at) reasons.push('created_at wajib jika resolved_at diisi');
    if (row.resolved_at && row.created_at && dateValue(row.resolved_at)! < dateValue(row.created_at)!) reasons.push('resolved_at sebelum created_at');
    if (row.satisfaction && !/^[1-5]$/.test(row.satisfaction)) reasons.push('satisfaction harus 1-5');
    const key = `${row.requester_name}\u0000${row.issue}\u0000${row.created_at || ''}`;
    if (seen.has(key)) duplicates.add(key); else seen.add(key);
    if (reasons.length) errors.push({ row: index + 2, reason: reasons.join(', ') }); else validRows.push(row);
  });
  if (duplicates.size) errors.push({ row: 1, reason: `${duplicates.size} data duplikat` });
  return { validRows, invalidRows: errors, totalRows: rows.length, validCount: errors.length ? 0 : validRows.length, invalidCount: errors.length, duplicateCount: duplicates.size };
};

const parseFile = async (file: Express.Multer.File) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === '.csv') {
    const rows: ImportRow[] = [];
    const parser = Readable.from(file.buffer).pipe(csvParser({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }));
    for await (const row of parser) rows.push(row as ImportRow);
    return { rows, headers: rows[0] ? Object.keys(rows[0]) : [] };
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { rows: [], headers: [] };
  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => headers.push(String(cell.value || '').trim().toLowerCase().replace(/\s+/g, '_')));
  const rows: ImportRow[] = [];
  worksheet.eachRow((excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    const row: ImportRow = {};
    headers.forEach((header, index) => {
      const value = excelRow.getCell(index + 1).value;
      row[header] = value && typeof value === 'object' && 'formula' in value ? `=${value.formula}` : value instanceof Date ? value.toISOString() : String(value ?? '');
    });
    rows.push(row);
  });
  return { rows, headers };
};

export const validateImport = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
    return;
  }
  try {
    const parsed = await parseFile(req.file);
    const result = validateRows(parsed.rows, parsed.headers);
    if (result.invalidCount) {
      res.status(422).json({ success: false, message: 'Data import tidak valid.', data: { ...result, preview: [] } });
      return;
    }
    const job = await prisma.importJob.create({ data: { userId: req.user!.id, payload: result.validRows as Prisma.InputJsonValue, summary: { totalRows: result.totalRows, validCount: result.validCount } } });
    res.status(201).json({ success: true, data: { jobId: job.id, status: job.status, ...result, preview: result.validRows.slice(0, 10) } });
  } catch {
    res.status(400).json({ success: false, message: 'Gagal memproses file.' });
  }
};

const normalizeName = (name: string) => name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

export const executeImport = async (req: AuthRequest, res: Response): Promise<void> => {
  const jobId = String(req.params.jobId || '');
  const job = await prisma.importJob.findFirst({ where: { id: jobId, userId: req.user!.id } });
  if (!job) {
    res.status(404).json({ success: false, message: 'Import job tidak ditemukan.' });
    return;
  }
  const staleBefore = new Date(Date.now() - Number(process.env.IMPORT_PROCESSING_TIMEOUT_MINUTES || 15) * 60000);
  if (job.status !== 'VALIDATED' && !(job.status === 'PROCESSING' && job.processingAt && job.processingAt < staleBefore)) {
    res.status(409).json({ success: false, message: 'Import job sudah diproses.' });
    return;
  }
  const claimed = await prisma.importJob.updateMany({ where: { id: job.id, OR: [{ status: 'VALIDATED' }, { status: 'PROCESSING', processingAt: { lt: staleBefore } }] }, data: { status: 'PROCESSING', processingAt: new Date() } });
  if (claimed.count !== 1) {
    res.status(409).json({ success: false, message: 'Import job sedang diproses.' });
    return;
  }
  let imported = 0;
  let failed = 0;
  for (const row of job.payload as ImportRow[]) {
    try {
      const category = await prisma.category.upsert({ where: { name: normalizeName(row.category) }, update: {}, create: { name: normalizeName(row.category) } });
      const department = await prisma.department.upsert({ where: { name: normalizeName(row.department) }, update: {}, create: { name: normalizeName(row.department) } });
      const technician = row.technician ? await prisma.technician.findFirst({ where: { name: { equals: row.technician, mode: 'insensitive' } } }) : null;
      const createdAt = row.created_at ? dateValue(row.created_at)! : new Date();
      const resolvedAt = row.resolved_at ? dateValue(row.resolved_at) : null;
      const slaTarget = getSlaTarget(row.priority);
      const resolutionTime = resolvedAt ? calculateResolutionTime(createdAt, resolvedAt) : null;
      await prisma.ticket.create({ data: { ticketId: createTicketId(), requesterName: row.requester_name, departmentId: department.id, location: row.location || null, categoryId: category.id, issue: row.issue, description: row.description || null, priority: row.priority as any, status: row.status as any, technicianId: technician?.id ?? null, slaTarget, resolutionTime, slaStatus: resolutionTime === null ? 'PENDING' : calculateSlaStatus(resolutionTime, slaTarget, row.status) as any, resolutionNotes: row.resolution_notes || null, satisfaction: row.satisfaction ? Number(row.satisfaction) : null, createdAt, resolvedAt } });
      imported++;
    } catch {
      failed++;
    }
  }
  await prisma.importJob.update({ where: { id: job.id }, data: { status: failed ? 'FAILED' : 'COMPLETED', imported, failed, executedAt: new Date() } });
  await logActivity(req.user!.id, 'IMPORT_DATA', `Mengimpor ${imported} data tiket`, { jobId, imported, failed }, req.ip);
  res.json({ success: true, data: { jobId, imported, failed, status: failed ? 'FAILED' : 'COMPLETED' } });
};

export const getImportJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const job = await prisma.importJob.findFirst({ where: { id: String(req.params.jobId), userId: req.user!.id }, select: { id: true, status: true, summary: true, imported: true, failed: true, createdAt: true, executedAt: true } });
  if (!job) res.status(404).json({ success: false, message: 'Import job tidak ditemukan.' });
  else res.json({ success: true, data: job });
};

export const downloadTemplate = async (_req: Request, res: Response): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Template Import');
  sheet.columns = [...allowed].map((key) => ({ header: key, key, width: 20 }));
  sheet.addRow({ requester_name: 'Budi Santoso', department: 'IT', category: 'Hardware', issue: 'Laptop tidak menyala', priority: 'HIGH', status: 'OPEN', created_at: '2026-01-10', satisfaction: '5' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=template-import-tiket.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};
