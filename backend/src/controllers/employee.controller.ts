import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/activityLogger';

// GET /api/employees - list all employees (Admin only)
export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, isActive } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { employeeCode: { contains: String(search), mode: 'insensitive' } },
        { department: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { employeeCode: 'asc' },
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// POST /api/employees - create employee
export const createEmployee = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { employeeCode, name, department, position } = req.body;

    if (!employeeCode || !name || !department) {
      res.status(400).json({ success: false, message: 'Nomor pegawai, nama, dan departemen wajib diisi.' });
      return;
    }

    const code = String(employeeCode).padStart(3, '0');
    const existing = await prisma.employee.findUnique({ where: { employeeCode: code } });
    if (existing) {
      res.status(409).json({ success: false, message: `Nomor pegawai ${code} sudah digunakan.` });
      return;
    }

    const employee = await prisma.employee.create({
      data: { employeeCode: code, name, department, position: position || null },
    });

    if (req.user) {
      await logActivity(req.user.id, 'CREATE_USER', `Menambah data pegawai: ${name} (${code})`, { employeeId: employee.id }, req.ip);
    }

    res.status(201).json({ success: true, message: 'Data pegawai berhasil ditambahkan.', data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// PUT /api/employees/:id - update employee
export const updateEmployee = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, department, position, isActive } = req.body;

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(department && { department }),
        ...(position !== undefined && { position }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (req.user) {
      await logActivity(req.user.id, 'UPDATE_USER', `Memperbarui data pegawai: ${employee.name}`, { employeeId: employee.id }, req.ip);
    }

    res.json({ success: true, message: 'Data pegawai berhasil diperbarui.', data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// POST /api/employees/import - import from CSV rows
export const importEmployees = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { rows } = req.body as { rows: { employeeCode: string; name: string; department: string; position?: string }[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'Tidak ada data untuk diimport.' });
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.employeeCode || !row.name || !row.department) { skipped++; continue; }
      const code = String(row.employeeCode).padStart(3, '0');
      try {
        await prisma.employee.upsert({
          where: { employeeCode: code },
          update: { name: row.name, department: row.department, position: row.position || null },
          create: { employeeCode: code, name: row.name, department: row.department, position: row.position || null },
        });
        imported++;
      } catch { skipped++; }
    }

    if (req.user) {
      await logActivity(req.user.id, 'IMPORT_DATA', `Import data pegawai: ${imported} berhasil, ${skipped} dilewati`, { imported, skipped }, req.ip);
    }

    res.json({ success: true, message: `Import selesai: ${imported} berhasil, ${skipped} dilewati.`, data: { imported, skipped } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
