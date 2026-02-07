import { Request, Response } from 'express';
import certificateService from '../services/certificate.service';
import progressService from '../services/progress.service';
import { ResponseUtil } from '../utils/response.util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CertificateController {
  async generate(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.body;
      const certificate = await certificateService.generate(enrollmentId);
      return ResponseUtil.success(res, 'Certificate generated successfully', certificate, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const certificate = await certificateService.getById(id);
      if (!certificate) return ResponseUtil.error(res, 'Certificate not found', 404);
      return ResponseUtil.success(res, 'Success', certificate);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const certificate = await certificateService.getByCode(code);
      if (!certificate) return ResponseUtil.error(res, 'Certificate not found', 404);
      return ResponseUtil.success(res, 'Success', certificate);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByStudent(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const certificates = await certificateService.getByStudent(studentId);
      return ResponseUtil.success(res, 'Success', certificates);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const certificates = await certificateService.getByClass(classId);
      return ResponseUtil.success(res, 'Success', certificates);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const result = await certificateService.verify(code);
      return ResponseUtil.success(res, result.message, result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async revoke(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const revokedBy = req.user!.id;
      const certificate = await certificateService.revoke(id, revokedBy, reason);
      return ResponseUtil.success(res, 'Certificate revoked successfully', certificate);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async checkCompletion(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.params;
      const result = await certificateService.checkCompletionRequirements(enrollmentId);
      return ResponseUtil.success(res, 'Success', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStatistics(_req: Request, res: Response) {
    try {
      const stats = await certificateService.getStatistics();
      return ResponseUtil.success(res, 'Success', stats);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async download(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const downloadInfo = await certificateService.download(id, userId);
      return ResponseUtil.success(res, 'Success', downloadInfo);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get certificate eligibility and progress for a student
   * Uses the 75% Attendance + 25% Assignment Completion formula
   */
  async getEligibility(req: Request, res: Response) {
    try {
      const { classId } = req.query;
      const userId = req.user!.id;

      if (!classId) {
        return ResponseUtil.error(res, 'classId query parameter is required', 400);
      }

      // Get student record for this user
      const student = await prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        return ResponseUtil.error(res, 'Student profile not found', 404);
      }

      // Check if student is enrolled in this class
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          classId_studentId: {
            classId: classId as string,
            studentId: student.id,
          },
        },
      });

      if (!enrollment) {
        return ResponseUtil.error(res, 'You are not enrolled in this class', 403);
      }

      // Get eligibility using the progress service
      const eligibility = await progressService.checkEligibility(
        student.id,
        classId as string
      );

      return ResponseUtil.success(res, 'Success', eligibility);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get class-wide certificate progress for all students
   * For instructors to view student progress
   */
  async getClassProgress(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const userId = req.user!.id;

      // Verify the user is an instructor for this class (or admin)
      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          instructor: true,
        },
      });

      if (!classInfo) {
        return ResponseUtil.error(res, 'Class not found', 404);
      }

      // Check authorization
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'ADMIN' && classInfo.instructor?.userId !== userId) {
        return ResponseUtil.error(res, 'You do not have permission to view this class progress', 403);
      }

      // Get progress for all students
      const progress = await progressService.getClassProgress(classId);

      // Get class stats
      const stats = {
        totalStudents: progress.length,
        eligible: progress.filter(p => p.eligible).length,
        averageProgress: progress.length > 0
          ? Math.round(progress.reduce((sum, p) => sum + p.overallGrade, 0) / progress.length)
          : 0,
        averageAttendance: progress.length > 0
          ? Math.round(progress.reduce((sum, p) => sum + p.attendanceScore, 0) / progress.length)
          : 0,
        averageAssignments: progress.length > 0
          ? Math.round(progress.reduce((sum, p) => sum + p.assignmentScore, 0) / progress.length)
          : 0,
      };

      return ResponseUtil.success(res, 'Success', {
        students: progress,
        stats,
      });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}

export default new CertificateController();
