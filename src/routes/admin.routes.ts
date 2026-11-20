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

// Super Admin Activity Logs (RBAC: SUPER_ADMIN only)
router.get('/activity-logs', authenticateUser, requireRole(ROLES.SUPER_ADMIN), AdminController.getActivityLogs);

// School Admin creates Teacher under their facility (RBAC: ADMIN, SUPER_ADMIN)
router.post('/create-teacher', authenticateUser, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), AdminController.createTeacher);

// Teacher or Admin creates Student under their class/facility (RBAC: TEACHER, ADMIN, SUPER_ADMIN)
router.post('/create-student', authenticateUser, requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), AdminController.createStudent);

export default router;
