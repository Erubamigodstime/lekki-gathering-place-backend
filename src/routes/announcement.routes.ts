import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create announcement (instructor only)
router.post('/', AnnouncementController.create);

// Get announcements for a class
router.get('/class/:classId', AnnouncementController.getByClass);

// Update announcement (instructor only)
router.put('/:id', AnnouncementController.update);

// Delete announcement (instructor only)
router.delete('/:id', AnnouncementController.delete);

// Increment view count
router.patch('/:id/view', AnnouncementController.incrementViews);

export default router;
