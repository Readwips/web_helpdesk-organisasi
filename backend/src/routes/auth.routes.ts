import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export { router as authRoutes };
