import { Router } from 'express';
import gradeController from '../controllers/grade.controller';
import { authMiddleware, validateRequest } from '../middleware/zod-validation.middleware';
import {
  createGradeSchema,
  updateGradeSchema,
  getGradeByIdSchema,
  getGradesByStudentSchema,
  publishGradeSchema,
  getStudentClassGradeSchema,
} from '../validators/canvas.validator';

const router = Router();

router.use(authMiddleware);

// Get complete gradebook for a class (instructor view)
router.get('/class/:classId/gradebook', gradeController.getClassGradebook);

// Get grade distribution for a class
router.get('/class/:classId/distribution', gradeController.getGradeDistribution);

// Bulk publish grades
router.post('/bulk-publish', gradeController.bulkPublishGrades);

// Create a new grade
router.post('/', validateRequest(createGradeSchema), gradeController.create);

// Get grade by ID
router.get('/:id', validateRequest(getGradeByIdSchema), gradeController.getById);

// Get grade by submission ID
router.get('/submission/:submissionId', gradeController.getBySubmission);

// Get grades by student
router.get('/student/:studentId', validateRequest(getGradesByStudentSchema), gradeController.getByStudent);

// Get all grades for a class
router.get('/class/:classId', gradeController.getByClass);

// Update a grade
router.put('/:id', validateRequest(updateGradeSchema), gradeController.update);

// Publish a grade
router.post('/:id/publish', validateRequest(publishGradeSchema), gradeController.publish);

// Unpublish a grade
router.post('/:id/unpublish', gradeController.unpublish);

// Delete a grade
router.delete('/:id', gradeController.delete);

// Get student's overall grade for a class
router.get('/student/:studentId/class/:classId', validateRequest(getStudentClassGradeSchema), gradeController.getStudentClassGrade);

// Get grade distribution for a class
router.get('/class/:classId/distribution', gradeController.getGradeDistribution);

// Get average score for an assignment
router.get('/assignment/:assignmentId/average', gradeController.getAssignmentAverage);

export default router;
