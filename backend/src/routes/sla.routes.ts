import { Router } from 'express';
import {
  getSlaSummary, getSlaByPriority, getSlaByCategory,
  getSlaByTechnician, getSlaBreachedTickets
} from '../controllers/sla.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getSlaSummary);
router.get('/by-priority', getSlaByPriority);
router.get('/by-category', getSlaByCategory);
router.get('/by-technician', getSlaByTechnician);
router.get('/breached', getSlaBreachedTickets);

export { router as slaRoutes };
