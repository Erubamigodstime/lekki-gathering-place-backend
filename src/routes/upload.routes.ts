import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadToCloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * General file upload endpoint
 * POST /api/v1/upload
 * Uploads file to Cloudinary and returns the URL
 */
router.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Determine folder based on file type
      let folder = 'general';
      if (file.mimetype.startsWith('image/')) {
        folder = 'images';
      } else if (file.mimetype === 'application/pdf') {
        folder = 'documents/pdf';
      } else if (
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        folder = 'documents/word';
      } else if (
        file.mimetype === 'application/vnd.ms-powerpoint' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ) {
        folder = 'documents/powerpoint';
      } else if (file.mimetype.startsWith('video/')) {
        folder = 'videos';
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

export default router;
