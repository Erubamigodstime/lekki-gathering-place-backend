import { Request, Response } from 'express';
import gradeService from '../services/grade.service';
import { ResponseUtil } from '../utils/response.util';
import { CreateGradeDTO, UpdateGradeDTO } from '../types';

export class GradeController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateGradeDTO = req.body;
      const gradedById = req.user!.id;
      const grade = await gradeService.create(data, gradedById);
      return ResponseUtil.success(res, 'Grade created successfully', grade, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const grade = await gradeService.getById(id);
      if (!grade) return ResponseUtil.error(res, 'Grade not found', 404);
      return ResponseUtil.success(res, 'Success', grade);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getBySubmission(req: Request, res: Response) {
    try {
      const { submissionId } = req.params;
      const grade = await gradeService.getBySubmission(submissionId);
      if (!grade) return ResponseUtil.error(res, 'Grade not found', 404);
      return ResponseUtil.success(res, 'Success', grade);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByStudent(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const classId = req.query.classId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const grades = await gradeService.getByStudent(studentId, classId, page, limit);
      return ResponseUtil.success(res, 'Success', grades);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const grades = await gradeService.getByClass(classId, page, limit);
      return ResponseUtil.success(res, 'Success', grades);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateGradeDTO = req.body;
      const grade = await gradeService.update(id, data);
      return ResponseUtil.success(res, 'Grade updated successfully', grade);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const grade = await gradeService.publish(id);
      return ResponseUtil.success(res, 'Grade published successfully', grade);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async unpublish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const grade = await gradeService.unpublish(id);
      return ResponseUtil.success(res, 'Grade unpublished successfully', grade);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await gradeService.delete(id);
      return ResponseUtil.success(res, 'Grade deleted successfully', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getStudentClassGrade(req: Request, res: Response) {
    try {
      const { studentId, classId } = req.params;
      const grade = await gradeService.getStudentClassGrade(studentId, classId);
      return ResponseUtil.success(res, 'Success', grade);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getGradeDistribution(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const distribution = await gradeService.getGradeDistribution(classId);
      return ResponseUtil.success(res, 'Success', distribution);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getAssignmentAverage(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const average = await gradeService.getAssignmentAverage(assignmentId);
      return ResponseUtil.success(res, 'Success', { average });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getClassGradebook(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const gradebook = await gradeService.getClassGradebook(classId);
      return ResponseUtil.success(res, 'Success', gradebook);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async bulkPublishGrades(req: Request, res: Response) {
    try {
      const { gradeIds } = req.body;
      
      if (!Array.isArray(gradeIds) || gradeIds.length === 0) {
        return ResponseUtil.error(res, 'gradeIds must be a non-empty array', 400);
      }

      const result = await gradeService.bulkPublishGrades(gradeIds);
      return ResponseUtil.success(res, 'Grades published successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}

export default new GradeController();
