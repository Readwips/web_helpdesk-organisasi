import { Router } from 'express';
import { verifyEmployee, createPublicTicket, getPublicCategories } from '../controllers/public.controller';

const router = Router();

// All public routes - no authentication required
router.post('/verify-employee', verifyEmployee);
router.post('/tickets', createPublicTicket);
router.get('/categories', getPublicCategories);

export { router as publicRoutes };
