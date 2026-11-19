import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createTeacherSchema, teacherIdParamSchema } from '../schemas/teacher.schema.js';

const router = Router();

// Create teacher
router.post('/', validateRequest({ body: createTeacherSchema }), TeacherController.createTeacher);

// Get all teachers
router.get('/', TeacherController.getAllTeachers);

// Get teacher by ID
router.get('/:id', validateRequest({ params: teacherIdParamSchema }), TeacherController.getTeacherById);

// Get sessions for a teacher (Available, Booked, Completed via Aggregation)
router.get('/:id/sessions', validateRequest({ params: teacherIdParamSchema }), TeacherController.getTeacherSessions);

export default router;
