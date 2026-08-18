import { Router } from 'express';
import {
  getCategories, getSubcategories, getDepartments, getTechnicians
} from '../controllers/master.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/categories', getCategories);
router.get('/subcategories', getSubcategories);
router.get('/departments', getDepartments);
router.get('/technicians', getTechnicians);

export { router as masterRoutes };
