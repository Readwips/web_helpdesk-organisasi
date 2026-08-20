import { Ticket, TicketFilters } from '../types';
import api from './api';

export const ticketService = {
  getAll: (filters: TicketFilters = {}) =>
    api.get('/tickets', { params: filters }),

  export: (params?: any) => 
    api.get('/tickets/export', { params, responseType: 'blob' }),

  getById: (id: number) =>
    api.get(`/tickets/${id}`),

  create: (data: Partial<Ticket>) =>
    api.post('/tickets', data),

  update: (id: number, data: Partial<Ticket>) =>
    api.put(`/tickets/${id}`, data),

  delete: (id: number) =>
    api.delete(`/tickets/${id}`),
};

export const analyticsService = {
  getKpi: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/analytics/kpi', { params }),

  getTrend: (period: 'day' | 'week' | 'month' = 'month') =>
    api.get('/analytics/trend', { params: { period } }),

  getCategories: () =>
    api.get('/analytics/categories'),

  getTopIssues: (limit = 10) =>
    api.get('/analytics/top-issues', { params: { limit } }),

  getDepartments: () =>
    api.get('/analytics/departments'),

  getTechnicians: () =>
    api.get('/analytics/technicians'),
};

export const slaService = {
  getSummary: () =>
    api.get('/sla/summary'),

  getByPriority: () =>
    api.get('/sla/by-priority'),

  getByCategory: () =>
    api.get('/sla/by-category'),

  getByTechnician: () =>
    api.get('/sla/by-technician'),

  getBreached: (params?: { page?: number; limit?: number }) =>
    api.get('/sla/breached', { params }),
};

export const masterService = {
  getCategories: () => api.get('/categories'),
  getSubcategories: (categoryId?: number) =>
    api.get('/subcategories', { params: { categoryId } }),
  getDepartments: () => api.get('/departments'),
  getTechnicians: () => api.get('/technicians'),
};

export const reportService = {
  getSummary: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/report/summary', { params }),

  exportExcel: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/report/export/excel', {
      params,
      responseType: 'blob',
    }),
};

export const importService = {
  validate: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  execute: (rows: Record<string, string>[]) =>
    api.post('/import/execute', { rows }),

  downloadTemplate: () =>
    api.get('/import/template', { responseType: 'blob' }),
};

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),

  updateProfile: (name: string, email: string) =>
    api.put('/auth/profile', { name, email }),
};

export const userService = {
  getAll: () =>
    api.get('/users'),

  getActivity: (id: number | 'all', params?: { page?: number; limit?: number; action?: string }) =>
    api.get(`/users/${id}/activity`, { params }),

  create: (data: any) =>
    api.post('/users', data),

  update: (id: number, data: any) =>
    api.put(`/users/${id}`, data),
};

// Public services — no auth needed
import axios from 'axios';
const publicApi = axios.create({ baseURL: 'http://localhost:5000/api/public' });

export const publicService = {
  verifyEmployee: (employeeCode: string) =>
    publicApi.post('/verify-employee', { employeeCode }),

  createTicket: (data: {
    employeeCode: string;
    categoryId: number;
    subcategoryId?: number;
    issue: string;
    description?: string;
    priority: string;
    location?: string;
  }) => publicApi.post('/tickets', data),

  getCategories: () =>
    publicApi.get('/categories'),
};

export const employeeService = {
  getAll: (params?: { search?: string; isActive?: boolean }) =>
    api.get('/employees', { params }),

  create: (data: { employeeCode: string; name: string; department: string; position?: string }) =>
    api.post('/employees', data),

  update: (id: number, data: any) =>
    api.put(`/employees/${id}`, data),

  import: (rows: any[]) =>
    api.post('/employees/import', { rows }),
};

export const notificationService = {
  getAll: () =>
    api.get('/notifications'),

  markAsRead: (id: number) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),
};
