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

type AnalyticsParams = { dateFrom?: string; dateTo?: string; signal?: AbortSignal };

export const analyticsService = {
  getKpi: ({ signal, ...params }: AnalyticsParams = {}) => api.get('/analytics/kpi', { params, signal }),
  getTrend: (period: 'day' | 'week' | 'month' = 'month', { signal, ...params }: AnalyticsParams = {}) => api.get('/analytics/trend', { params: { period, ...params }, signal }),
  getCategories: ({ signal, ...params }: AnalyticsParams = {}) => api.get('/analytics/categories', { params, signal }),
  getTopIssues: (limit = 10, { signal, ...params }: AnalyticsParams = {}) => api.get('/analytics/top-issues', { params: { limit, ...params }, signal }),
  getDepartments: (params?: AnalyticsParams) => api.get('/analytics/departments', { params }),
  getTechnicians: (params?: AnalyticsParams) => api.get('/analytics/technicians', { params }),
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

  getBreached: ({ signal, ...params }: { page?: number; limit?: number; dateFrom?: string; dateTo?: string; signal?: AbortSignal } = {}) =>
    api.get('/sla/breached', { params, signal }),
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
    return api.post('/import/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  execute: (jobId: string) =>
    api.post(`/import/jobs/${jobId}/execute`),

  getJob: (jobId: string) =>
    api.get(`/import/jobs/${jobId}`),

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
import { API_URL } from './api';
const publicApi = axios.create({ baseURL: `${API_URL}/public` });

export const publicService = {
  verifyEmployee: (employeeCode: string, turnstileToken: string) =>
    publicApi.post('/verify-employee', { employeeCode, turnstileToken }),

  createTicket: (data: {
    verificationToken: string;
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
