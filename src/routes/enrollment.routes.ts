// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';
import { AppError } from '@/middleware/error.middleware';
import { PaginationUtil } from '@/utils/pagination.util';

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

    console.log('Fetching enrollments for user:', userId);

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    console.log('Student profile lookup result:', student ? `Found: ${student.id}` : 'Not found');

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

    console.log('Enrollments found:', enrollments.length, 'Statuses:', enrollments.map(e => e.status));

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
    const { status, page = '1', limit = '50' } = req.query;
    const { skip, take } = PaginationUtil.getSkipTake(parseInt(page as string), parseInt(limit as string));

    console.log('Fetching enrollments for class:', classId, 'with status:', status);

    const where: any = { classId };
    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              maxCapacity: true,
            },
          },
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
      }),
      prisma.enrollment.count({ where }),
    ]);

    console.log('Found', enrollments.length, 'enrollments for class', classId);
    console.log('Enrollment statuses:', enrollments.map(e => ({ studentName: e.student.user.firstName, status: e.status })));

    const paginatedResponse = PaginationUtil.createPaginatedResponse(
      enrollments,
      total,
      parseInt(page as string),
      parseInt(limit as string)
    );

    ResponseUtil.success(res, 'Enrollments retrieved successfully', paginatedResponse);
  })
);

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get all enrollments (Admin/Instructor)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, page = '1', limit = '50' } = req.query;
    const { skip, take } = PaginationUtil.getSkipTake(parseInt(page as string), parseInt(limit as string));
    const currentUser = req.user!;

    const where: any = {};
    if (status) where.status = status;

    // If instructor, only show enrollments for their classes
    if (currentUser.role === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({
        where: { userId: currentUser.id },
        include: { classes: { select: { id: true } } }
      });

      if (instructor) {
        const classIds = instructor.classes.map(c => c.id);
        where.classId = { in: classIds };
      }
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take,
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
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
                  wardId: true,
                  ward: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.enrollment.count({ where }),
    ]);

    const paginatedResponse = PaginationUtil.createPaginatedResponse(
      enrollments,
      total,
      parseInt(page as string),
      parseInt(limit as string)
    );

    ResponseUtil.success(res, 'Enrollments retrieved successfully', paginatedResponse);
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

    console.log('Enrollment request received:', { userId, classId });

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    console.log('Student profile found:', student ? 'Yes' : 'No', student?.id);

    if (!student) {
      console.error('Student profile not found for userId:', userId);
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

    console.log('Existing enrollment check:', existingEnrollment ? 'Already enrolled' : 'Not enrolled');

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

    console.log('Enrollment created successfully:', {
      enrollmentId: enrollment.id,
      classId: enrollment.classId,
      studentId: enrollment.studentId,
      status: enrollment.status,
      className: enrollment.class.name,
      instructorId: enrollment.class.instructorId,
      instructorName: enrollment.class.instructor?.user ? 
        `${enrollment.class.instructor.user.firstName} ${enrollment.class.instructor.user.lastName}` : 
        'No instructor'
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
