import { Router } from 'express';
import submissionController from '../controllers/submission.controller';
import { authMiddleware, validateRequest } from '../middleware/zod-validation.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadToCloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/error.middleware';
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  getSubmissionByIdSchema,
  getSubmissionsByAssignmentSchema,
  getSubmissionsByStudentSchema,
  submitSubmissionSchema,
  approveSubmissionSchema,
  rejectSubmissionSchema,
} from '../validators/canvas.validator';

const router = Router();

router.use(authMiddleware);

// Create a new submission
router.post('/', validateRequest(createSubmissionSchema), submissionController.create);

// Get submissions by class (must be before /:id to avoid conflict)
router.get('/class/:classId', submissionController.getByClass);

// Get submissions by assignment
router.get('/assignment/:assignmentId', validateRequest(getSubmissionsByAssignmentSchema), submissionController.getByAssignment);

// Get submissions by student
router.get('/student/:studentId', validateRequest(getSubmissionsByStudentSchema), submissionController.getByStudent);

// Get submission by ID (must be after specific routes)
router.get('/:id', validateRequest(getSubmissionByIdSchema), submissionController.getById);

// Update a submission
router.put('/:id', validateRequest(updateSubmissionSchema), submissionController.update);

// Submit a draft submission
router.post('/:id/submit', validateRequest(submitSubmissionSchema), submissionController.submit);

// Approve a submission
router.post('/:id/approve', validateRequest(approveSubmissionSchema), submissionController.approve);

// Reject a submission
router.post('/:id/reject', validateRequest(rejectSubmissionSchema), submissionController.reject);

// Upload file for submission
router.post(
  '/:id/upload',
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Determine folder based on file type
      let folder = 'submissions';
      if (file.mimetype.startsWith('image/')) {
        folder = 'submissions/images';
      } else if (file.mimetype.startsWith('video/')) {
        folder = 'submissions/videos';
      } else if (file.mimetype === 'application/pdf') {
        folder = 'submissions/documents';
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, folder);

      res.json({
        success: true,
        message: 'File uploaded successfully',
        url: result.url,
        publicId: result.publicId,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a submission
router.delete('/:id', submissionController.delete);

// Get submission history for a student on an assignment
router.get('/history/:assignmentId/:studentId', submissionController.getHistory);

export default router;
