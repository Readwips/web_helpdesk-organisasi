import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('GetCategories error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getSubcategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.query as { categoryId?: string };
    const where = categoryId ? { categoryId: parseInt(categoryId) } : {};
    const subcategories = await prisma.subcategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: true },
    });
    res.json({ success: true, data: subcategories });
  } catch (error) {
    console.error('GetSubcategories error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('GetDepartments error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

export const getTechnicians = async (_req: Request, res: Response): Promise<void> => {
  try {
    const technicians = await prisma.technician.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: technicians });
  } catch (error) {
    console.error('GetTechnicians error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};
