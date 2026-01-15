import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseUtil } from '../utils/response.util';

const prisma = new PrismaClient();

export class WeekProgressController {
  /**
   * Submit week completion for approval
   * POST /api/v1/week-progress
   */
  async submitCompletion(req: Request, res: Response) {
    try {
      const { classId, studentId, weekNumber } = req.body;

      // OPTIMIZED: Parallelize independent queries
      const [student, lessonData] = await Promise.all([
        prisma.student.findFirst({
          where: { userId: studentId },
        }),
        prisma.lesson.findFirst({
          where: {
            classId,
            weekNumber,
          },
        }),
      ]);

      if (!student) {
        return ResponseUtil.error(res, 'Student not found', 404);
      }

      // Check if student is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          classId,
          studentId: student.id,
          status: 'APPROVED',
        },
      });

      if (!enrollment) {
        return ResponseUtil.error(res, 'Not enrolled in this class', 403);
      }

      // Get or create lesson for this week
      let lesson = lessonData;
      
      // If no lesson exists, create a placeholder
      if (!lesson) {
        lesson = await prisma.lesson.create({
          data: {
            title: `Week ${weekNumber} Content`,
            weekNumber,
            classId,
            description: 'Lesson content will be added by instructor',
            isPublished: true,
          },
        });
      }

      // Check if progress already exists
      const existingProgress = await prisma.weekProgress.findFirst({
        where: {
          enrollmentId: enrollment.id,
          studentId: student.id,
          lessonId: lesson.id,
          weekNumber,
        },
      });

      let progress;

      if (existingProgress) {
        // Update existing progress
        progress = await prisma.weekProgress.update({
          where: { id: existingProgress.id },
          data: {
            completed: true,
            completedAt: new Date(),
            instructorApproved: false, // Reset approval status
          },
        });
      } else {
        // Create new progress
        progress = await prisma.weekProgress.create({
          data: {
            enrollmentId: enrollment.id,
            studentId: student.id,
            lessonId: lesson.id,
            weekNumber,
            completed: true,
            completedAt: new Date(),
            instructorApproved: false,
          },
        });
      }

      return ResponseUtil.success(
        res,
        'Week completion submitted for approval',
        progress,
        201
      );
    } catch (error: any) {
      console.error('Submit completion error:', error);
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get student's week progress for a class
   * GET /api/v1/week-progress?classId=xxx&studentId=xxx
   */
  async getStudentProgress(req: Request, res: Response) {
    try {
      const { classId, studentId } = req.query;

      if (!classId || !studentId) {
        return ResponseUtil.error(res, 'classId and studentId are required', 400);
      }

      const student = await prisma.student.findFirst({
        where: { userId: studentId as string },
      });

      if (!student) {
        return ResponseUtil.error(res, 'Student not found', 404);
      }

      const progress = await prisma.weekProgress.findMany({
        where: {
          studentId: student.id,
          enrollment: {
            classId: classId as string,
          },
        },
        include: {
          lesson: true,
        },
        orderBy: {
          weekNumber: 'asc',
        },
      });

      return ResponseUtil.success(res, 'Student progress retrieved', progress);
    } catch (error: any) {
      console.error('Get student progress error:', error);
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Approve week completion (Instructor only)
   * POST /api/v1/week-progress/:id/approve
   */
  async approveCompletion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get progress record
      const progressRecord = await prisma.weekProgress.findUnique({
        where: { id },
        include: {
          enrollment: {
            include: {
              class: {
                include: {
                  instructor: true,
                },
              },
            },
          },
        },
      });

      if (!progressRecord) {
        return ResponseUtil.error(res, 'Progress record not found', 404);
      }

      // Verify instructor owns this class
      if (progressRecord.enrollment.class.instructor.userId !== userId) {
        return ResponseUtil.error(res, 'Not authorized to approve this completion', 403);
      }

      // Update approval status
      const updatedProgress = await prisma.weekProgress.update({
        where: { id },
        data: {
          instructorApproved: true,
          approvedAt: new Date(),
        },
      });

      return ResponseUtil.success(res, 'Week completion approved', updatedProgress);
    } catch (error: any) {
      console.error('Approve completion error:', error);
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get pending approvals for instructor
   * GET /api/v1/week-progress/pending?classId=xxx
   */
  async getPendingApprovals(req: Request, res: Response) {
    try {
      const { classId } = req.query;
      const userId = req.user?.id;

      if (!classId) {
        return ResponseUtil.error(res, 'classId is required', 400);
      }

      // Verify instructor owns this class
      const classRecord = await prisma.class.findFirst({
        where: {
          id: classId as string,
          instructor: {
            userId,
          },
        },
      });

      if (!classRecord) {
        return ResponseUtil.error(res, 'Class not found or not authorized', 404);
      }

      const pendingApprovals = await prisma.weekProgress.findMany({
        where: {
          enrollment: {
            classId: classId as string,
          },
          completed: true,
          instructorApproved: false,
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
          lesson: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      return ResponseUtil.success(
        res,
        'Pending approvals retrieved',
        pendingApprovals
      );
    } catch (error: any) {
      console.error('Get pending approvals error:', error);
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}

export default new WeekProgressController();
