import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createUserSchema, userIdParamSchema } from '../schemas/user.schema.js';

const router = Router();

// API 1 - Create User
router.post('/', validateRequest({ body: createUserSchema }), UserController.createUser);

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
