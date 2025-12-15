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
 * /attendance/mark:
 *   post:
 *     summary: Mark attendance (Student)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/mark',
  authenticate,
  authorize(UserRole.STUDENT),
  asyncHandler(async (req: Request, res: Response) => {
    const { classId, notes } = req.body;
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student profile not found');
    }

    // Check if enrolled in the class
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'APPROVED') {
      throw new AppError('You are not enrolled in this class', 403);
    }

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classId,
        studentId: student.id,
        date: {
          gte: today,
        },
      },
    });

    if (existingAttendance) {
      throw new AppError('Attendance already marked for today', 409);
    }

    const attendance = await prisma.attendance.create({
      data: {
        classId,
        studentId: student.id,
        notes,
      },
      include: {
        class: true,
        student: {
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
    });

    ResponseUtil.created(res, 'Attendance marked successfully', attendance);
  })
);

/**
 * @swagger
 * /attendance/my-attendance:
 *   get:
 *     summary: Get my attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my-attendance',
  authenticate,
  authorize(UserRole.STUDENT),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { classId, startDate, endDate } = req.query;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student profile not found');
    }

    const where: any = { studentId: student.id };
    if (classId) where.classId = classId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendance = await prisma.attendance.findMany({
      where,
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
      orderBy: { date: 'desc' },
    });

    ResponseUtil.success(res, 'Attendance retrieved successfully', attendance);
  })
);

/**
 * @swagger
 * /attendance/class/{classId}:
 *   get:
 *     summary: Get attendance for a class
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/class/:classId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { status, startDate, endDate } = req.query;

    const where: any = { classId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendance = await prisma.attendance.findMany({
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
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { markedAt: 'desc' }],
    });

    ResponseUtil.success(res, 'Attendance retrieved successfully', attendance);
  })
);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const { status, startDate, endDate } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        class: true,
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
      },
      orderBy: { date: 'desc' },
    });

    ResponseUtil.success(res, 'Attendance retrieved successfully', attendance);
  })
);

/**
 * @swagger
 * /attendance/{id}/approve:
 *   patch:
 *     summary: Approve/Reject attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const currentUser = req.user!;

    const attendanceRecord = await prisma.attendance.findUnique({
      where: { id },
      include: { class: { include: { instructor: true } } },
    });

    if (!attendanceRecord) {
      return ResponseUtil.notFound(res, 'Attendance record not found');
    }

    // Check if instructor owns the class
    if (
      currentUser.role === UserRole.INSTRUCTOR &&
      attendanceRecord.class.instructor.userId !== currentUser.id
    ) {
      return ResponseUtil.forbidden(res, 'You can only approve attendance for your classes');
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: currentUser.id },
    });

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
        rejectionReason,
        approvedByInstructorId: instructor?.id,
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

    ResponseUtil.success(res, `Attendance ${status.toLowerCase()} successfully`, attendance);
  })
);

export default router;
