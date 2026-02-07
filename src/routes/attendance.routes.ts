// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';
import { AppError } from '@/middleware/error.middleware';
import { PaginationUtil } from '@/utils/pagination.util';
import progressService from '@/services/progress.service';

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
    const { classId, notes, date } = req.body;
    const userId = req.user!.id;

    // Validate required fields
    if (!classId) {
      throw new AppError('classId is required', 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student profile not found');
    }

    // Check if enrolled in the class and get class schedule
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId: student.id,
        },
      },
      include: {
        class: {
          select: {
            schedule: true,
          },
        },
      },
    });

    if (!enrollment || enrollment.status !== 'APPROVED') {
      throw new AppError('You are not enrolled in this class', 403);
    }

    // Use provided date or default to today
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Validate the date is a valid class day
    const schedule = enrollment.class.schedule as { days?: string[] } | null;
    const scheduleDays = schedule?.days || ['Thursday'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const attendanceDayName = dayNames[attendanceDate.getDay()];
    
    if (!scheduleDays.includes(attendanceDayName)) {
      throw new AppError(`Invalid date: ${attendanceDayName} is not a scheduled class day. Class meets on: ${scheduleDays.join(', ')}`, 400);
    }

    // Check if attendance already marked for this specific date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classId,
        studentId: student.id,
        date: attendanceDate,
      },
    });

    if (existingAttendance) {
      throw new AppError('Attendance already marked for this date', 409);
    }

    const attendance = await prisma.attendance.create({
      data: {
        classId,
        studentId: student.id,
        notes,
        date: attendanceDate,
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
 * /attendance/unmark:
 *   delete:
 *     summary: Unmark/remove attendance (Student)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     description: Allows students to remove their pending attendance for a specific date
 */
router.delete(
  '/unmark',
  authenticate,
  authorize(UserRole.STUDENT),
  asyncHandler(async (req: Request, res: Response) => {
    const { classId, date } = req.body;
    const userId = req.user!.id;

    // Validate required fields
    if (!classId) {
      throw new AppError('classId is required', 400);
    }
    if (!date) {
      throw new AppError('date is required', 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return ResponseUtil.notFound(res, 'Student profile not found');
    }

    // Find the attendance record for this date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classId,
        studentId: student.id,
        date: attendanceDate,
      },
    });

    if (!existingAttendance) {
      return ResponseUtil.notFound(res, 'Attendance record not found for this date');
    }

    // Only allow unmarking if status is still PENDING
    if (existingAttendance.status !== 'PENDING') {
      throw new AppError('Cannot unmark attendance that has already been approved or rejected', 403);
    }

    await prisma.attendance.delete({
      where: { id: existingAttendance.id },
    });

    ResponseUtil.success(res, 'Attendance unmarked successfully');
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
    const { status, startDate, endDate, page = '1', limit = '50' } = req.query;
    const { skip, take } = PaginationUtil.getSkipTake(parseInt(page as string), parseInt(limit as string));

    const where: any = { classId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take,
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
      }),
      prisma.attendance.count({ where }),
    ]);

    const paginatedResponse = PaginationUtil.createPaginatedResponse(
      attendance,
      total,
      parseInt(page as string),
      parseInt(limit as string)
    );

    ResponseUtil.success(res, 'Attendance retrieved successfully', paginatedResponse);
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
    const { status, startDate, endDate, classId, wardId, groupBy, page = '1', limit = '50' } = req.query;
    const { skip, take } = PaginationUtil.getSkipTake(parseInt(page as string), parseInt(limit as string));
    const currentUser = req.user!;

    const where: any = {};
    if (status) where.status = status;
    if (classId) where.classId = classId;
    
    // For PENDING status, only show current or past dates (hide future dates from instructor queue)
    if (status === 'PENDING') {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      where.date = { ...(where.date || {}), lte: today };
    }
    
    if (startDate || endDate) {
      where.date = where.date || {};
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

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              instructor: {
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    }
                  }
                }
              },
              ward: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
                  ward: {
                    select: {
                      id: true,
                      name: true,
                    }
                  }
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    const paginatedResponse = PaginationUtil.createPaginatedResponse(
      attendance,
      total,
      parseInt(page as string),
      parseInt(limit as string)
    );

    ResponseUtil.success(res, 'Attendance retrieved successfully', paginatedResponse);
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

    // Update certificate progress when attendance is approved or rejected
    try {
      await progressService.updateProgressByStudentAndClass(
        attendance.studentId,
        attendance.classId
      );
    } catch (progressError) {
      console.error('Failed to update progress after attendance change:', progressError);
      // Continue anyway - the progress will be calculated on next request
    }

    ResponseUtil.success(res, `Attendance ${status.toLowerCase()} successfully`, attendance);
  })
);

export default router;