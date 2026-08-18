import { Router } from 'express';
import {
  getKpi, getTicketTrend, getCategoryDistribution,
  getTopIssues, getDepartmentAnalysis, getTechnicianPerformance
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/kpi', getKpi);
router.get('/trend', getTicketTrend);
router.get('/categories', getCategoryDistribution);
router.get('/top-issues', getTopIssues);
router.get('/departments', getDepartmentAnalysis);
router.get('/technicians', getTechnicianPerformance);

export { router as analyticsRoutes };
