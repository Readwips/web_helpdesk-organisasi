import { Router } from 'express';
import { changePassword, getMe, login, logout, updateProfile } from '../controllers/auth.controller';
import { authenticate, requireCsrf } from '../middleware/auth.middleware';
import { loginLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, requireCsrf, logout);
router.put('/change-password', authenticate, requireCsrf, changePassword);
router.put('/profile', authenticate, requireCsrf, updateProfile);
export { router as authRoutes };
