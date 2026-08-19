/**
 * Role-Based Access Control (RBAC) configuration
 * Defines which roles can access which features/pages
 */

export type UserRole = 'ADMIN' | 'IT_SUPPORT' | 'MANAGER';

export const PERMISSIONS = {
  // Pages / routes
  PAGE_KELOLA_TIKET: ['ADMIN', 'IT_SUPPORT'] as UserRole[],
  PAGE_DATA_TIKET:   ['ADMIN', 'IT_SUPPORT', 'MANAGER'] as UserRole[],
  PAGE_ANALISIS:     ['ADMIN', 'MANAGER'] as UserRole[],
  PAGE_SLA:          ['ADMIN', 'IT_SUPPORT', 'MANAGER'] as UserRole[],
  PAGE_IMPORT:       ['ADMIN'] as UserRole[],
  PAGE_LAPORAN:      ['ADMIN', 'MANAGER'] as UserRole[],
  PAGE_PENGATURAN:   ['ADMIN', 'IT_SUPPORT', 'MANAGER'] as UserRole[],
  PAGE_MANAJEMEN_AKUN: ['ADMIN', 'MANAGER'] as UserRole[],

  // Actions within pages
  ACTION_CREATE_TICKET: ['ADMIN', 'IT_SUPPORT'] as UserRole[],
  ACTION_EDIT_TICKET:   ['ADMIN', 'IT_SUPPORT'] as UserRole[],
  ACTION_DELETE_TICKET: ['ADMIN'] as UserRole[],
  ACTION_ASSIGN_TICKET: ['ADMIN', 'MANAGER'] as UserRole[],
  ACTION_EXPORT_REPORT: ['ADMIN', 'MANAGER'] as UserRole[],
  ACTION_IMPORT_DATA:   ['ADMIN'] as UserRole[],
  ACTION_MANAGE_USERS:  ['ADMIN'] as UserRole[],
} as const;

/**
 * Check if a role has permission for a specific action/page
 */
export function hasPermission(role: UserRole | string | undefined, permission: UserRole[]): boolean {
  if (!role) return false;
  return permission.includes(role as UserRole);
}
