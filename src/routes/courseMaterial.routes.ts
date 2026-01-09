import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCourseMaterial,
  getCourseMaterialsByLesson,
  deleteCourseMaterial,
} from '../controllers/courseMaterial.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create course material
router.post('/', createCourseMaterial);

// Get materials by lesson
router.get('/lesson/:lessonId', getCourseMaterialsByLesson);

// Delete course material
router.delete('/:id', deleteCourseMaterial);

export default router;
