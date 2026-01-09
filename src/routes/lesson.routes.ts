import { Router } from 'express';
import lessonController from '../controllers/lesson.controller';
import { authMiddleware, validateRequest } from '../middleware/zod-validation.middleware';
import {
  createLessonSchema,
  updateLessonSchema,
  getLessonByIdSchema,
  getLessonsByClassSchema,
  getLessonByWeekSchema,
  markLessonCompleteSchema,
} from '../validators/canvas.validator';

const router = Router();

// All lesson routes require authentication
router.use(authMiddleware);

// Create a new lesson (Instructor/Admin only)
router.post(
  '/',
  validateRequest(createLessonSchema),
  lessonController.create
);

// Get lesson by ID
router.get(
  '/:id',
  validateRequest(getLessonByIdSchema),
  lessonController.getById
);

// Get all lessons for a class
router.get(
  '/class/:classId',
  validateRequest(getLessonsByClassSchema),
  lessonController.getByClass
);

// Get lesson by week number
router.get(
  '/class/:classId/week/:weekNumber',
  validateRequest(getLessonByWeekSchema),
  lessonController.getByWeek
);

// Update a lesson
router.put(
  '/:id',
  validateRequest(updateLessonSchema),
  lessonController.update
);

// Publish a lesson
router.post('/:id/publish', lessonController.publish);

// Unpublish a lesson
router.post('/:id/unpublish', lessonController.unpublish);

// Delete a lesson
router.delete('/:id', lessonController.delete);

// Mark lesson as complete for a student
router.post(
  '/:lessonId/complete',
  validateRequest(markLessonCompleteSchema),
  lessonController.markComplete
);

// Mark lesson as incomplete for a student
router.delete('/:lessonId/complete', lessonController.markIncomplete);

// Get student's completed lessons
router.get('/student/completed', lessonController.getStudentCompletedLessons);

// Get student progress for a lesson
router.get('/:lessonId/progress/:studentId', lessonController.getStudentProgress);

// Get completion statistics for a lesson
router.get('/:lessonId/stats', lessonController.getCompletionStats);

export default router;
