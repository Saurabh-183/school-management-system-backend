import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Platform Overview (RBAC: ADMIN only or authenticated users)
router.get('/overview', AdminController.getOverview);

export default router;
