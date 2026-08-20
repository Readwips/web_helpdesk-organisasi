export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'IT_SUPPORT' | 'MANAGER';
  createdAt?: string;
  _count?: {
    activityLogs?: number;
  };
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  category?: Category;
}

export interface Department {
  id: number;
  name: string;
}

export interface Technician {
  id: number;
  name: string;
  email: string;
}

export interface Ticket {
  id: number;
  ticketId: string;
  requesterName: string;
  departmentId: number;
  location?: string;
  categoryId: number;
  subcategoryId?: number;
  issue: string;
  description?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  technicianId?: number;
  slaTarget: number;
  resolutionTime?: number;
  slaStatus: 'MET' | 'BREACHED' | 'PENDING';
  satisfaction?: number;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  category?: Category;
  subcategory?: Subcategory;
  department?: Department;
  technician?: Technician;
}

export interface KpiData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaBreached: number;
  slaMet: number;
  slaCompliance: number;
  avgResolutionTime: number;
}

export interface TrendData {
  date: string;
  total: number;
  resolved: number;
}

export interface CategoryData {
  category: string;
  count: number;
}

export interface TopIssueData {
  issue: string;
  count: number;
}

export interface DepartmentData {
  department: string;
  count: number;
  avgResolutionTime: number;
}

export interface TechnicianData {
  id: number;
  name: string;
  email: string;
  totalTickets: number;
  resolvedTickets: number;
  slaMet: number;
  slaBreached: number;
  slaCompliance: number;
  avgResolutionTime: number;
}

export interface SlaSummary {
  totalResolved: number;
  slaMet: number;
  slaBreached: number;
  slaCompliance: number;
  avgResolutionTime: number;
  avgBreachTime: number;
}

export interface SlaByPriority {
  priority: string;
  met: number;
  breached: number;
  total: number;
  compliance: number;
}

export interface SlaByCategory {
  category: string;
  met: number;
  breached: number;
  compliance: number;
}

export interface SlaByTechnician {
  technician: string;
  met: number;
  breached: number;
  compliance: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  priority?: string;
  department?: string;
  technician?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
