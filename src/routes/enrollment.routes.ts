// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';
import { AppError } from '@/middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /enrollments/my-classes:
 *   get:
 *     summary: Get my enrolled classes
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my-classes',
  authenticate,
  authorize(UserRole.STUDENT),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student profile not found');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        class: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                  },
                },
              },
            },
            ward: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    ResponseUtil.success(res, 'Enrollments retrieved successfully', enrollments);
  })
);

/**
 * @swagger
 * /enrollments/class/{classId}:
 *   get:
 *     summary: Get enrollments for a class
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/class/:classId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req: Request, res: Response) => {
    const { classId } = req.params;
    const { status } = req.query;

    const where: any = { classId };
    if (status) where.status = status;

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    ResponseUtil.success(res, 'Enrollments retrieved successfully', enrollments);
  })
);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Enroll in a class
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.STUDENT),
  asyncHandler(async (req: Request, res: Response) => {
    const { classId } = req.body;
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student profile not found');
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
    });

    if (!classData) {
      return ResponseUtil.notFound(res, 'Class not found');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId: student.id,
        },
      },
    });

    if (existingEnrollment) {
      throw new AppError('You are already enrolled in this class', 409);
    }

    // Check capacity
    if (classData._count.enrollments >= classData.maxCapacity) {
      throw new AppError('Class is at full capacity', 400);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        classId,
        studentId: student.id,
      },
      include: {
        class: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    ResponseUtil.created(res, 'Enrollment request submitted successfully', enrollment);
  })
);

/**
 * @swagger
 * /enrollments/{id}/approve:
 *   patch:
 *     summary: Approve/Reject enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
        rejectionReason,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        class: true,
      },
    });

    ResponseUtil.success(res, `Enrollment ${status.toLowerCase()} successfully`, enrollment);
  })
);

/**
 * @swagger
 * /enrollments/{id}:
 *   delete:
 *     summary: Cancel enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.STUDENT),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!enrollment) {
      return ResponseUtil.notFound(res, 'Enrollment not found');
    }

    if (enrollment.student.userId !== userId) {
      return ResponseUtil.forbidden(res, 'You can only cancel your own enrollments');
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    ResponseUtil.success(res, 'Enrollment cancelled successfully');
  })
);

export default router;
