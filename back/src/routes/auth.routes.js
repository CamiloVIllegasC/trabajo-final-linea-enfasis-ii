import { Router } from 'express';
import { login, register, getCurrentUser, desactUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.patch('/desactivar/:id', authenticate, desactUser);
export default router;
