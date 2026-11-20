import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

// All notification routes require authenticated Bearer token
router.use(authenticateUser);

router.get('/', NotificationController.getNotifications);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
