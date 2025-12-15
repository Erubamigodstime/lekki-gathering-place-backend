// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';
import { PaginationUtil } from '@/utils/pagination.util';

const router = Router();

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder } = PaginationUtil.getPaginationParams(req.query);
    const { skip, take } = PaginationUtil.getSkipTake(page, limit);
    const { wardId, classId } = req.query;

    const where: any = {};
    
    if (classId) {
      // Filter by class enrollment
      where.enrollments = {
        some: {
          classId: classId as string,
          status: 'APPROVED',
        },
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              profilePicture: true,
              status: true,
              wardId: true,
              ward: true,
              createdAt: true,
            },
            where: wardId ? { wardId: wardId as string } : undefined,
          },
          _count: {
            select: {
              enrollments: {
                where: { status: 'APPROVED' },
              },
              attendance: true,
            },
          },
        },
      }),
      prisma.student.count({
        where,
      }),
    ]);

    const paginatedResponse = PaginationUtil.createPaginatedResponse(students, total, page, limit);
    ResponseUtil.success(res, 'Students retrieved successfully', paginatedResponse);
  })
);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
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
            status: true,
            wardId: true,
            ward: true,
          },
        },
        enrollments: {
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
        },
        _count: {
          select: {
            enrollments: true,
            attendance: true,
          },
        },
      },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student not found');
    }

    ResponseUtil.success(res, 'Student retrieved successfully', student);
  })
);

/**
 * @swagger
 * /students/{id}/attendance:
 *   get:
 *     summary: Get student attendance history
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/attendance',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { classId, startDate, endDate } = req.query;

    const where: any = { studentId: id };
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
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate stats
    const total = attendance.length;
    const approved = attendance.filter((a) => a.status === 'APPROVED').length;
    const attendanceRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    ResponseUtil.success(res, 'Attendance history retrieved successfully', {
      attendance,
      stats: {
        total,
        approved,
        pending: attendance.filter((a) => a.status === 'PENDING').length,
        rejected: attendance.filter((a) => a.status === 'REJECTED').length,
        attendanceRate,
      },
    });
  })
);

export default router;
