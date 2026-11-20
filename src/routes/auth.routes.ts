import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { loginSchema, registerSchema, impersonateSchema } from '../schemas/auth.schema.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.post('/register', validateRequest({ body: registerSchema }), AuthController.register);
router.post('/logout', authenticateUser, AuthController.logout);
router.get('/me', authenticateUser, AuthController.getMe);

// Direct Login via Super Admin without recording activity
router.post(
  '/impersonate-login',
  authenticateUser,
  requireRole(ROLES.SUPER_ADMIN),
  validateRequest({ body: impersonateSchema }),
  AuthController.impersonateLogin
);

export default router;
