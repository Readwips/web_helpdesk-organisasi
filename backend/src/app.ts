import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Mengizinkan semua origin (Vercel Frontend)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      db: 'connected',
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwt: !!process.env.JWT_SECRET,
      timestamp: new Date() 
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'error', 
      db: 'failed',
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwt: !!process.env.JWT_SECRET,
      error: err.message 
    });
  }
});

app.use('/api', masterRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 IT Helpdesk Ticket Analysis API ready`);
});

export default app;
