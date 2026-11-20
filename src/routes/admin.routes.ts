import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Platform Overview (RBAC: ADMIN, SUPER_ADMIN)
router.get('/overview', AdminController.getOverview);

// Super Admin Overview (RBAC: SUPER_ADMIN only)
router.get('/super-overview', authenticateUser, requireRole(ROLES.SUPER_ADMIN), AdminController.getSuperOverview);

// Create Admin (RBAC: SUPER_ADMIN only - Super Admin provisions Organization Admins)
router.post('/create-admin', authenticateUser, requireRole(ROLES.SUPER_ADMIN), AdminController.createAdmin);

// School / Organization Admin Overview (RBAC: ADMIN, SUPER_ADMIN)
router.get('/school-overview', authenticateUser, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AdminController.getSchoolOverview);

export default router;
