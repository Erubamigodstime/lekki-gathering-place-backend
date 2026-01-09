import { Router } from 'express';
import weekProgressController from '../controllers/weekProgress.controller';
import { authMiddleware } from '../middleware/zod-validation.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Submit week completion for approval
router.post('/', weekProgressController.submitCompletion);

// Get student's week progress for a class
router.get('/', weekProgressController.getStudentProgress);

// Approve week completion (Instructor only)
router.post('/:id/approve', weekProgressController.approveCompletion);

// Get pending approvals for instructor
router.get('/pending', weekProgressController.getPendingApprovals);

export default router;
