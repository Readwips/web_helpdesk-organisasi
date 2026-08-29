import { Router } from 'express';
import { verifyEmployee, createPublicTicket, getPublicCategories } from '../controllers/public.controller';
import { employeeVerificationLimiter, publicTicketLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/verify-employee', employeeVerificationLimiter, verifyEmployee);
router.post('/tickets', publicTicketLimiter, createPublicTicket);
router.get('/categories', getPublicCategories);

export { router as publicRoutes };
