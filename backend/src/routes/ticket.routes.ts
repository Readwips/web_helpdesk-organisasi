import { Router } from 'express';
import {
  getTickets, getTicketById, createTicket, updateTicket, deleteTicket, exportTickets
} from '../controllers/ticket.controller';
import { authenticate, authorize, requireCsrf } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTickets);
router.get('/export', authorize('ADMIN', 'MANAGER'), exportTickets);
router.get('/:id', getTicketById);
router.post('/', requireCsrf, authorize('ADMIN', 'IT_SUPPORT'), createTicket);
router.put('/:id', requireCsrf, authorize('ADMIN', 'IT_SUPPORT'), updateTicket);
router.delete('/:id', requireCsrf, authorize('ADMIN'), deleteTicket);

export { router as ticketRoutes };
