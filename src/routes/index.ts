import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import teacherRoutes from './teacher.routes.js';
import sessionRoutes from './session.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);
router.use('/sessions', sessionRoutes);
router.use('/admin', adminRoutes);

export default router;
