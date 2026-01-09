// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';
import { upload } from '@/middleware/upload.middleware';
import { uploadToCloudinary } from '@/config/cloudinary';

const router = Router();

/**
 * @swagger
 * /instructors:
 *   get:
 *     summary: Get all instructors
 *     tags: [Instructors]
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status } = req.query;

    console.log('GET /instructors called with status:', status);

    const where: any = {};
    if (status) where.approvalStatus = status;

    console.log('Query where clause:', where);

    const instructors = await prisma.instructor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
            wardId: true,
            ward: true,
          },
        },
        _count: {
          select: {
            classes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Found instructors:', instructors.length);
    console.log('Instructor details:', instructors.map(i => ({
      id: i.id,
      name: `${i.user.firstName} ${i.user.lastName}`,
      approvalStatus: i.approvalStatus
    })));

    ResponseUtil.success(res, 'Instructors retrieved successfully', instructors);
  })
);

/**
 * @swagger
 * /instructors/profile:
 *   get:
 *     summary: Get current instructor's profile
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/profile',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    console.log('Fetching instructor profile for userId:', userId);

    const instructor = await prisma.instructor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
            wardId: true,
            ward: true,
          },
        },
        classes: {
          include: {
            ward: true,
            _count: {
              select: {
                enrollments: {
                  where: { status: 'APPROVED' },
                },
              },
            },
          },
        },
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    if (!instructor) {
      console.log('Instructor profile not found for userId:', userId);
      return ResponseUtil.notFound(res, 'Instructor profile not found');
    }

    console.log('Instructor profile found:', {
      id: instructor.id,
      approvalStatus: instructor.approvalStatus,
      classesCount: instructor.classes.length,
      classes: instructor.classes.map(c => ({ id: c.id, name: c.name }))
    });

    ResponseUtil.success(res, 'Instructor profile retrieved successfully', instructor);
  })
);

/**
 * @swagger
 * /instructors/{id}:
 *   get:
 *     summary: Get instructor by ID
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
            wardId: true,
            ward: true,
          },
        },
        classes: {
          include: {
            ward: true,
            _count: {
              select: {
                enrollments: {
                  where: { status: 'APPROVED' },
                },
              },
            },
          },
        },
      },
    });

    if (!instructor) {
      return ResponseUtil.notFound(res, 'Instructor not found');
    }

    ResponseUtil.success(res, 'Instructor retrieved successfully', instructor);
  })
);

/**
 * @swagger
 * /instructors/profile:
 *   patch:
 *     summary: Update instructor profile
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/profile',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { skills, bio, experience, availabilityCalendar } = req.body;

    const instructor = await prisma.instructor.update({
      where: { userId },
      data: {
        skills,
        bio,
        experience,
        availabilityCalendar,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    ResponseUtil.success(res, 'Instructor profile updated successfully', instructor);
  })
);

/**
 * @swagger
 * /instructors/documents:
 *   post:
 *     summary: Upload instructor documents
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/documents',
  authenticate,
  authorize(UserRole.INSTRUCTOR),
  upload.array('documents', 5),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return ResponseUtil.badRequest(res, 'No files uploaded');
    }

    // Upload files to Cloudinary
    const uploadPromises = files.map((file) => uploadToCloudinary(file, 'instructor-documents'));
    const uploadResults = await Promise.all(uploadPromises);
    const documentUrls = uploadResults.map((result) => result.url);

    // Update instructor documents
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return ResponseUtil.notFound(res, 'Instructor profile not found');
    }

    const updatedInstructor = await prisma.instructor.update({
      where: { userId },
      data: {
        documents: [...instructor.documents, ...documentUrls],
      },
    });

    ResponseUtil.success(res, 'Documents uploaded successfully', {
      documents: updatedInstructor.documents,
    });
  })
);

/**
 * @swagger
 * /instructors/{id}/approve:
 *   patch:
 *     summary: Approve/Reject instructor
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        approvalStatus: status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: status === 'APPROVED' ? req.user!.id : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
        rejectionReason,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    ResponseUtil.success(res, `Instructor ${status.toLowerCase()} successfully`, instructor);
  })
);

export default router;
