import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authenticate, requireCsrf } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/read-all', requireCsrf, markAllAsRead);
router.put('/:id/read', requireCsrf, markAsRead);

export const notificationRoutes = router;
