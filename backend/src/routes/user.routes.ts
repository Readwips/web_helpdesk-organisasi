import { Router } from 'express';
import { getUsers, getUserActivity, createUser, updateUser } from '../controllers/user.controller';
import { authenticate, authorize, requireCsrf } from '../middleware/auth.middleware';

const router = Router();

// Only ADMIN and MANAGER can access user list and activities
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

router.get('/', getUsers);
router.get('/:id/activity', getUserActivity);

// Only ADMIN can create and update users
router.post('/', requireCsrf, authorize('ADMIN'), createUser);
router.put('/:id', requireCsrf, authorize('ADMIN'), updateUser);

export { router as userRoutes };
