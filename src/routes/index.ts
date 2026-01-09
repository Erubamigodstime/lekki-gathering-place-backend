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

// Canvas LMS routes
import lessonRoutes from './lesson.routes';
import assignmentRoutes from './assignment.routes';
import submissionRoutes from './submission.routes';
import gradeRoutes from './grade.routes';
import messageRoutes from './message.routes';
import certificateRoutes from './certificate.routes';
import weekProgressRoutes from './weekProgress.routes';
import courseMaterialRoutes from './courseMaterial.routes';
import uploadRoutes from './upload.routes';
import announcementRoutes from './announcement.routes';

const router = Router();

// Health check endpoint (also used for keep-alive)
router.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Keep-alive endpoint (for cron jobs to ping)
router.get('/keep-alive', (_req, res) => {
  res.json({
    status: 'alive',
    message: 'Server is awake',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes - Core functionality
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wards', wardRoutes);
router.use('/classes', classRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/instructors', instructorRoutes);
router.use('/students', studentRoutes);
router.use('/notifications', notificationRoutes);

// API routes - Canvas LMS functionality
router.use('/lessons', lessonRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/grades', gradeRoutes);
router.use('/messages', messageRoutes);
router.use('/certificates', certificateRoutes);
router.use('/week-progress', weekProgressRoutes);
router.use('/course-materials', courseMaterialRoutes);
router.use('/upload', uploadRoutes);
router.use('/announcements', announcementRoutes);

export default router;

