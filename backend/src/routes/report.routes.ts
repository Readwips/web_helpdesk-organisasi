import { Router } from 'express';
import { getReportSummary, exportExcel } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getReportSummary);
router.get('/export/excel', exportExcel);

export { router as reportRoutes };
