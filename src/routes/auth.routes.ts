import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.post('/register', validateRequest({ body: registerSchema }), AuthController.register);
router.get('/me', authenticateUser, AuthController.getMe);

export default router;
