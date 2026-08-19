import { Router } from 'express';
import { getUsers, getUserActivity, createUser, updateUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only ADMIN and MANAGER can access user list and activities
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

router.get('/', getUsers);
router.get('/:id/activity', getUserActivity);

// Only ADMIN can create and update users
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);

export { router as userRoutes };
