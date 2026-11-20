import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createUserSchema, userIdParamSchema } from '../schemas/user.schema.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/index.js';
import { AppError } from '../errors/app-error.js';

const router = Router();

// API 1 - Create User (RBAC: Unauthenticated public registration or TEACHER / ADMIN)
router.post(
  '/',
  optionalAuth,
  (req, _res, next) => {
    // If request is authenticated as STUDENT, block them: students cannot register other students
    if (req.user && req.user.role === ROLES.STUDENT) {
      return next(
        new AppError('Forbidden: Students are not permitted to register new students. Only Teachers and Admins have access.', 403)
      );
    }
    next();
  },
  validateRequest({ body: createUserSchema }),
  UserController.createUser
);

// API 6 - User Session List
router.get(
  '/:id/sessions',
  validateRequest({ params: userIdParamSchema }),
  UserController.getUserSessions
);

// Helper endpoints
router.get('/', UserController.getAllUsers);
router.get('/:id', validateRequest({ params: userIdParamSchema }), UserController.getUserById);

export default router;
