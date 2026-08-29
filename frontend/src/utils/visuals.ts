export const statusClass: Record<string, string> = {
  OPEN: 'badge-open',
  IN_PROGRESS: 'badge-in-progress',
  PENDING: 'badge-pending',
  RESOLVED: 'badge-resolved',
  CLOSED: 'badge-closed',
};

export const priorityClass: Record<string, string> = {
  CRITICAL: 'priority-critical',
  HIGH: 'priority-high',
  MEDIUM: 'priority-medium',
  LOW: 'priority-low',
};

export const slaClass: Record<string, string> = {
  MET: 'sla-met',
  BREACHED: 'sla-breached',
  PENDING: 'sla-pending',
};

export const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
