import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import teacherRoutes from './teacher.routes.js';
import sessionRoutes from './session.routes.js';
import adminRoutes from './admin.routes.js';
import { runSeed } from '../services/seed.service.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Seed endpoint for instant cloud database initialization & demo reset
const handleSeed = async (req: Request, res: Response) => {
  try {
    const forceReset = req.query.reset === 'true' || req.body?.reset === true || true;
    const result = await runSeed(forceReset);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Seeding failed',
    });
  }
};

router.get('/seed', handleSeed);
router.post('/seed', handleSeed);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);
router.use('/sessions', sessionRoutes);
router.use('/admin', adminRoutes);

export default router;
