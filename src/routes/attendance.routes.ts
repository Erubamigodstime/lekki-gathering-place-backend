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
 *     summary: Get all attendance records with advanced filtering
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const { status, startDate, endDate, classId, wardId, groupBy } = req.query;
    const currentUser = req.user!;

    const where: any = {};
    if (status) where.status = status;
    if (classId) where.classId = classId;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    // Ward filter
    if (wardId) {
      where.student = {
        user: {
          wardId: wardId as string
        }
      };
    }

    // If instructor, only show attendance for their classes
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
                  }
                }
              }
            },
            ward: true
          }
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
                ward: true
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
 * /attendance/report:
 *   get:
 *     summary: Get attendance report with aggregations
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/report',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, classId, wardId, groupBy = 'class' } = req.query;
    const currentUser = req.user!;

    const where: any = {};
    if (classId) where.classId = classId;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    // Ward filter
    if (wardId) {
      where.student = {
        user: {
          wardId: wardId as string
        }
      };
    }

    // If instructor, only show attendance for their classes
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

    // Get all attendance records
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
                  }
                }
              }
            }
          }
        },
        student: {
          include: {
            user: {
              select: {
                ward: true
              }
            }
          }
        }
      },
    });

    // Group by class
    const groupedData: any[] = [];
    const classMap = new Map();

    attendance.forEach(record => {
      const classId = record.class.id;
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classId: record.class.id,
          className: record.class.name,
          instructorName: `${record.class.instructor.user.firstName} ${record.class.instructor.user.lastName}`,
          totalAttendance: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          dates: new Set()
        });
      }
      
      const classData = classMap.get(classId);
      classData.totalAttendance++;
      classData.dates.add(record.date.toISOString().split('T')[0]);
      
      if (record.status === 'APPROVED') classData.approved++;
      else if (record.status === 'PENDING') classData.pending++;
      else if (record.status === 'REJECTED') classData.rejected++;
    });

    classMap.forEach(value => {
      groupedData.push({
        ...value,
        uniqueDates: value.dates.size,
        dates: undefined
      });
    });

    ResponseUtil.success(res, 'Attendance report generated successfully', {
      summary: {
        totalRecords: attendance.length,
        totalClasses: groupedData.length,
        dateRange: {
          start: startDate,
          end: endDate
        }
      },
      data: groupedData
    });
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