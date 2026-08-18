import { Router } from 'express';
import {
  getTickets, getTicketById, createTicket, updateTicket, deleteTicket, exportTickets
} from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTickets);
router.get('/export', exportTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.delete('/:id', authorize('ADMIN'), deleteTicket);

export { router as ticketRoutes };
