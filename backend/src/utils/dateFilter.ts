import { Response } from 'express';

export type DateQuery = { dateFrom?: string; dateTo?: string };

const parseDate = (value: string, endOfDay: boolean) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

export const parseDateFilter = (query: DateQuery, res: Response) => {
  const { dateFrom, dateTo } = query;
  const from = dateFrom ? parseDate(dateFrom, false) : undefined;
  const to = dateTo ? parseDate(dateTo, true) : undefined;
  if ((dateFrom && !from) || (dateTo && !to)) {
    res.status(400).json({ success: false, message: 'Tanggal harus valid dan menggunakan format YYYY-MM-DD.' });
    return null;
  }
  if (from && to && from > to) {
    res.status(400).json({ success: false, message: 'Rentang tanggal tidak valid.' });
    return null;
  }
  return from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {};
};
