import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
  origin: 'http://localhost:5173',
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
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'IT Helpdesk API is running', timestamp: new Date() });
});

app.use('/api', masterRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 IT Helpdesk Ticket Analysis API ready`);
});

export default app;
