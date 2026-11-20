import { Router } from 'express';
import { SessionController } from '../controllers/session.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createSessionSchema,
  getAvailableSessionsQuerySchema,
  bookSessionParamSchema,
  bookSessionBodySchema,
  completeSessionParamSchema,
} from '../schemas/session.schema.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// API 2 - Create Session (RBAC: TEACHER or ADMIN)
router.post(
  '/',
  optionalAuth,
  (req, res, next) => {
    if (req.user && !([ROLES.TEACHER, ROLES.ADMIN] as string[]).includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only TEACHER or ADMIN can schedule sessions. Current role: '${req.user.role}'`,
      });
    }
    next();
  },
  validateRequest({ body: createSessionSchema }),
  SessionController.createSession
);

// API 3 - Available Sessions for Booking
router.get(
  '/available',
  validateRequest({ query: getAvailableSessionsQuerySchema }),
  SessionController.getAvailableSessions
);

// API 4 - Book Session (RBAC: STUDENT or ADMIN)
router.post(
  '/:id/book',
  optionalAuth,
  (req, res, next) => {
    if (req.user && !([ROLES.STUDENT, ROLES.ADMIN] as string[]).includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only STUDENT or ADMIN can book sessions. Current role: '${req.user.role}'`,
      });
    }
    // Auto-inject userId from token if not explicitly provided
    if (req.user && !req.body?.userId) {
      req.body = { ...req.body, userId: req.user.userId };
    }
    next();
  },
  validateRequest({ params: bookSessionParamSchema, body: bookSessionBodySchema }),
  SessionController.bookSession
);

// API 5 - Mark Session Complete (RBAC: TEACHER or ADMIN)
router.patch(
  '/:id/complete',
  optionalAuth,
  (req, res, next) => {
    if (req.user && !([ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN] as string[]).includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only TEACHER or ADMIN can complete sessions. Current role: '${req.user.role}'`,
      });
    }
    next();
  },
  validateRequest({ params: completeSessionParamSchema }),
  SessionController.completeSession
);

// Learning Resources: Get Resources (Notes, Videos, Documents)
router.get(
  '/:id/resources',
  optionalAuth,
  SessionController.getSessionResources
);

// Learning Resources: Add Lecture Note (Teacher / Admin)
router.post(
  '/:id/notes',
  optionalAuth,
  (req, res, next) => {
    if (req.user && !([ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN] as string[]).includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Teachers or Admins can upload lecture notes.',
      });
    }
    next();
  },
  SessionController.addLectureNote
);

// Learning Resources: Add Video Lecture (Teacher / Admin)
router.post(
  '/:id/videos',
  optionalAuth,
  (req, res, next) => {
    if (req.user && !([ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN] as string[]).includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Teachers or Admins can upload video lectures.',
      });
    }
    next();
  },
  SessionController.addVideoLecture
);

// Learning Resources: Upload Subject Document (Teacher / Admin)
router.post(
  '/:id/documents',
  optionalAuth,
  (req, res, next) => {
    if (req.user && !([ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN] as string[]).includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Teachers or Admins can upload subject documents.',
      });
    }
    next();
  },
  SessionController.addSubjectDocument
);

export default router;
