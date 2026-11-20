import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createTeacherSchema, teacherIdParamSchema } from '../schemas/teacher.schema.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/index.js';
import { AppError } from '../errors/app-error.js';

const router = Router();

// Create teacher (RBAC: Only Admin can create new Teacher profiles)
router.post(
  '/',
  optionalAuth,
  (req, _res, next) => {
    if (req.user && req.user.role !== ROLES.ADMIN) {
      return next(
        new AppError('Forbidden: Only platform Administrators can create new Teacher profiles.', 403)
      );
    }
    next();
  },
  validateRequest({ body: createTeacherSchema }),
  TeacherController.createTeacher
);

// Get all teachers
router.get('/', TeacherController.getAllTeachers);

// Get teacher by ID
router.get('/:id', validateRequest({ params: teacherIdParamSchema }), TeacherController.getTeacherById);

// Get sessions for a teacher (Available, Booked, Completed via Aggregation)
router.get('/:id/sessions', validateRequest({ params: teacherIdParamSchema }), TeacherController.getTeacherSessions);

export default router;
