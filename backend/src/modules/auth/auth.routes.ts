import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { registerSchema, loginSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register.bind(authController));
authRouter.post('/login', validate({ body: loginSchema }), authController.login.bind(authController));
authRouter.get('/me', authMiddleware, authController.me.bind(authController));
