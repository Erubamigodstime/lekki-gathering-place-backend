import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import wardRoutes from './ward.routes';
import classRoutes from './class.routes';
import enrollmentRoutes from './enrollment.routes';
import attendanceRoutes from './attendance.routes';
import instructorRoutes from './instructor.routes';
import studentRoutes from './student.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Health check endpoint (also used for keep-alive)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Keep-alive endpoint (for cron jobs to ping)
router.get('/keep-alive', (req, res) => {
  res.json({
    status: 'alive',
    message: 'Server is awake',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wards', wardRoutes);
router.use('/classes', classRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/instructors', instructorRoutes);
router.use('/students', studentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
