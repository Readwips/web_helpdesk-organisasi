import { Router } from 'express';
import { changePassword, enableMfa, getMe, login, logout, setupMfa, updateProfile, verifyMfa } from '../controllers/auth.controller';
import { authenticate, requireCsrf } from '../middleware/auth.middleware';
import { loginLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.post('/login', loginLimiter, login);
router.post('/mfa/verify', loginLimiter, verifyMfa);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, requireCsrf, logout);
router.post('/mfa/setup', authenticate, requireCsrf, setupMfa);
router.post('/mfa/enable', authenticate, requireCsrf, enableMfa);
router.put('/change-password', authenticate, requireCsrf, changePassword);
router.put('/profile', authenticate, requireCsrf, updateProfile);
export { router as authRoutes };
