import { randomBytes } from 'crypto';

export const createTicketId = () => `TKT-${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`.slice(0, 20);
