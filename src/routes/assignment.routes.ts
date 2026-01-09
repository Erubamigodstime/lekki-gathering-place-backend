import { Router } from 'express';
import assignmentController from '../controllers/assignment.controller';
import { authMiddleware, validateRequest } from '../middleware/zod-validation.middleware';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  getAssignmentByIdSchema,
  getAssignmentsByLessonSchema,
  getAssignmentsForStudentSchema,
} from '../validators/canvas.validator';

const router = Router();

router.use(authMiddleware);

// Create a new assignment
router.post('/', validateRequest(createAssignmentSchema), assignmentController.create);

// Get assignment by ID
router.get('/:id', validateRequest(getAssignmentByIdSchema), assignmentController.getById);

// Get assignments by lesson
router.get('/lesson/:lessonId', validateRequest(getAssignmentsByLessonSchema), assignmentController.getByLesson);

// Get assignments by class
router.get('/class/:classId', assignmentController.getByClass);

// Get assignments for a student (with submission status)
router.get('/student/:classId/:studentId', validateRequest(getAssignmentsForStudentSchema), assignmentController.getForStudent);

// Update an assignment
router.put('/:id', validateRequest(updateAssignmentSchema), assignmentController.update);

// Publish an assignment
router.post('/:id/publish', assignmentController.publish);

// Unpublish an assignment
router.post('/:id/unpublish', assignmentController.unpublish);

// Delete an assignment
router.delete('/:id', assignmentController.delete);

// Get submission statistics
router.get('/:id/stats', assignmentController.getSubmissionStats);

// Get average score
router.get('/:id/average', assignmentController.getAverageScore);

// Duplicate assignment to another lesson
router.post('/:id/duplicate', assignmentController.duplicate);

export default router;
