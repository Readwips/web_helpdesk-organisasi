import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/activityLogger';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ success: false, message: 'Email atau password salah.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Email atau password salah.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    await logActivity(user.id, 'LOGIN', 'Berhasil masuk ke sistem', null, req.ip);

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getMe = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const logout = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  if (req.user) {
    await logActivity(req.user.id, 'LOGOUT', 'Keluar dari sistem', null, req.ip);
  }
  res.json({ success: true, message: 'Logout berhasil.' });
};

export const changePassword = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Password saat ini tidak benar.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    await logActivity(user.id, 'CHANGE_PASSWORD', 'Mengubah password akun', null, req.ip);

    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const updateProfile = async (req: Request & { user?: { id: number } }, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Format email tidak valid.' });
      return;
    }

    // Check if email already used by another user
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: req.user!.id } },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email sudah digunakan oleh akun lain.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name.trim(), email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true, role: true },
    });

    await logActivity(req.user!.id, 'UPDATE_PROFILE', 'Mengubah profil (nama/email)', { name, email }, req.ip);

    res.json({ success: true, message: 'Profil berhasil diperbarui.', data: updated });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
