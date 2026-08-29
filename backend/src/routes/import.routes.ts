import { Router } from 'express';
import { downloadTemplate, executeImport, getImportJob, upload, validateImport } from '../controllers/import.controller';
import { authenticate, authorize, requireCsrf } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.post('/jobs', requireCsrf, upload.single('file'), validateImport);
router.get('/jobs/:jobId', getImportJob);
router.post('/jobs/:jobId/execute', requireCsrf, executeImport);
router.get('/template', downloadTemplate);
export { router as importRoutes };
