import { Router } from 'express';
import { getReportSummary, exportExcel } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'MANAGER'));

router.get('/summary', getReportSummary);
router.get('/export/excel', exportExcel);

export { router as reportRoutes };
