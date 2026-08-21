import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/activityLogger';

// GET /users - list all IT Support users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'IT_SUPPORT' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        technicianId: true,
        technician: {
          select: { id: true, name: true }
        },
        _count: {
          select: { activityLogs: { where: { action: 'LOGIN' } } }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Flatten technicianName for easier consumption
    const result = users.map(u => ({
      ...u,
      technicianName: u.technician?.name ?? null,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// GET /users/:id/activity - get activity logs for a specific user or all users
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, limit = '50', page = '1' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (id !== 'all') {
      where.userId = parseInt(String(id));
    }
    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetUserActivity error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// POST /users - create a new IT Support user
export const createUser = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email sudah digunakan.' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'IT_SUPPORT',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (req.user) {
      await logActivity(req.user.id, 'CREATE_USER', `Membuat akun baru: ${email}`, { newUserId: newUser.id }, req.ip);
    }

    res.status(201).json({ success: true, message: 'Akun berhasil dibuat.', data: newUser });
  } catch (error) {
    console.error('CreateUser error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// PUT /users/:id - update an IT Support user
export const updateUser = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password, technicianName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(String(id)) } });
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
      return;
    }

    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findFirst({ where: { email, NOT: { id: parseInt(String(id)) } } });
      if (emailTaken) {
        res.status(409).json({ success: false, message: 'Email sudah digunakan oleh akun lain.' });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // If technicianName is provided, update the linked Technician record
    if (technicianName) {
      const linkedTech = await prisma.technician.findFirst({
        where: { user: { id: parseInt(String(id)) } },
      });
      if (linkedTech) {
        await prisma.technician.update({
          where: { id: linkedTech.id },
          data: { name: technicianName },
        });
        if (req.user) {
          await logActivity(
            req.user.id,
            'UPDATE_USER',
            `Mengubah nama teknisi akun ${existingUser.name} menjadi "${technicianName}"`,
            { targetUserId: parseInt(String(id)), technicianName },
            req.ip
          );
        }
        res.json({ success: true, message: 'Nama teknisi berhasil diperbarui.' });
        return;
      } else {
        res.status(404).json({ success: false, message: 'Akun ini belum memiliki teknisi terhubung.' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(String(id)) },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (req.user) {
      await logActivity(req.user.id, 'UPDATE_USER', `Mengedit akun: ${updatedUser.email}`, { updatedUserId: updatedUser.id }, req.ip);
    }

    res.json({ success: true, message: 'Akun berhasil diupdate.', data: updatedUser });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
