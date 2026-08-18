/**
 * Menghitung SLA target dalam jam berdasarkan priority
 */
export const getSlaTarget = (priority: string): number => {
  const slaMap: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 48,
  };
  return slaMap[priority] || 24;
};

/**
 * Menghitung resolution time dalam jam
 */
export const calculateResolutionTime = (createdAt: Date, resolvedAt: Date): number => {
  const diffMs = resolvedAt.getTime() - createdAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100; // 2 decimal places
};

/**
 * Menentukan SLA status berdasarkan resolution time dan SLA target
 */
export const calculateSlaStatus = (
  resolutionTime: number | null,
  slaTarget: number,
  status: string
): string => {
  if (!resolutionTime || status === 'OPEN' || status === 'IN_PROGRESS' || status === 'PENDING') {
    return 'PENDING';
  }
  return resolutionTime <= slaTarget ? 'MET' : 'BREACHED';
};

/**
 * Menghitung SLA compliance percentage
 */
export const calculateSlaCompliance = (slaMet: number, totalResolved: number): number => {
  if (totalResolved === 0) return 0;
  return Math.round((slaMet / totalResolved) * 100 * 100) / 100;
};
