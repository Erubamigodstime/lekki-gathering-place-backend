import { Router } from 'express';
import certificateController from '../controllers/certificate.controller';
import { authMiddleware, validateRequest } from '../middleware/zod-validation.middleware';
import {
  generateCertificateSchema,
  getCertificateByIdSchema,
  getCertificateByCodeSchema,
  verifyCertificateSchema,
  revokeCertificateSchema,
  getCertificatesByStudentSchema,
} from '../validators/canvas.validator';

const router = Router();

router.use(authMiddleware);

// Generate a certificate for a completed enrollment
router.post('/', validateRequest(generateCertificateSchema), certificateController.generate);

// Get certificate eligibility and progress for a student
router.get('/eligibility', certificateController.getEligibility);

// Get class-wide certificate progress (for instructors)
router.get('/class-progress/:classId', certificateController.getClassProgress);

// Get certificate by ID
router.get('/:id', validateRequest(getCertificateByIdSchema), certificateController.getById);

// Get certificate by code
router.get('/code/:code', validateRequest(getCertificateByCodeSchema), certificateController.getByCode);

// Get certificates by student
router.get('/student/:studentId', validateRequest(getCertificatesByStudentSchema), certificateController.getByStudent);

// Get certificates by class
router.get('/class/:classId', certificateController.getByClass);

// Verify a certificate
router.get('/verify/:code', validateRequest(verifyCertificateSchema), certificateController.verify);

// Revoke a certificate
router.post('/:id/revoke', validateRequest(revokeCertificateSchema), certificateController.revoke);

// Check completion requirements for an enrollment
router.get('/check/:enrollmentId', certificateController.checkCompletion);

// Get certificate statistics
router.get('/stats/all', certificateController.getStatistics);

// Download a certificate
router.get('/:id/download', certificateController.download);

export default router;
