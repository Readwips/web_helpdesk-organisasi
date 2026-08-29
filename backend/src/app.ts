import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';
import { authRoutes } from './routes/auth.routes';
import { ticketRoutes } from './routes/ticket.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { slaRoutes } from './routes/sla.routes';
import { importRoutes } from './routes/import.routes';
import { reportRoutes } from './routes/report.routes';
import { userRoutes } from './routes/user.routes';
import { masterRoutes } from './routes/master.routes';
import { publicRoutes } from './routes/public.routes';
import { employeeRoutes } from './routes/employee.routes';
import { notificationRoutes } from './routes/notification.routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './lib/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
app.use(helmet());
app.use(requestLogger);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin tidak diizinkan.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/import', importRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);
// Health check (public — must be before masterRoutes)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('health_database_failure', { requestId: _req.requestId, error });
    res.status(503).json({
      status: 'error',
      message: 'Database tidak tersedia.',
      requestId: _req.requestId,
      timestamp: new Date(),
    });
  }
});

app.use('/api', masterRoutes);

// Error handler
app.use(errorHandler);

export default app;
