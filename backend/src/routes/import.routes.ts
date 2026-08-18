import { Router } from 'express';
import { upload, validateImport, executeImport, downloadTemplate } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/validate', upload.single('file'), validateImport);
router.post('/execute', executeImport);
router.get('/template', downloadTemplate);

export { router as importRoutes };
