type Level = 'info' | 'error';

const redact = (value: unknown): unknown => {
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, /password|token|secret|authorization|cookie|key/i.test(key) ? '[REDACTED]' : redact(item)]));
};

const write = (level: Level, event: string, data: Record<string, unknown> = {}) => {
  const safeData = redact(data) as Record<string, unknown>;
  const payload = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...safeData });
  (level === 'error' ? console.error : console.log)(payload);
};

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => write('info', event, data),
  error: (event: string, data?: Record<string, unknown>) => write('error', event, data),
};
