import { Request, Response } from 'express';
import assignmentService from '../services/assignment.service';
import { ResponseUtil } from '../utils/response.util';
import { CreateAssignmentDTO, UpdateAssignmentDTO } from '../types';

export class AssignmentController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateAssignmentDTO = req.body;
      const assignment = await assignmentService.create(data);
      return ResponseUtil.success(res, 'Assignment created successfully', assignment, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const includeRelations = req.query.includeRelations === 'true';
      const assignment = await assignmentService.getById(id, includeRelations);
      if (!assignment) return ResponseUtil.error(res, 'Assignment not found', 404);
      return ResponseUtil.success(res, 'Success', assignment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByLesson(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const includeUnpublished = req.query.includeUnpublished === 'true';
      const assignments = await assignmentService.getByLesson(lessonId, includeUnpublished);
      return ResponseUtil.success(res, 'Success', assignments);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const includeUnpublished = req.query.includeUnpublished === 'true';
      const assignments = await assignmentService.getByClass(classId, includeUnpublished);
      return ResponseUtil.success(res, 'Success', assignments);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getForStudent(req: Request, res: Response) {
    try {
      const { classId, studentId } = req.params;
      const assignments = await assignmentService.getForStudent(classId, studentId);
      return ResponseUtil.success(res, 'Success', assignments);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateAssignmentDTO = req.body;
      const assignment = await assignmentService.update(id, data);
      return ResponseUtil.success(res, 'Assignment updated successfully', assignment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const assignment = await assignmentService.publish(id);
      return ResponseUtil.success(res, 'Assignment published successfully', assignment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async unpublish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const assignment = await assignmentService.unpublish(id);
      return ResponseUtil.success(res, 'Assignment unpublished successfully', assignment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await assignmentService.delete(id);
      return ResponseUtil.success(res, 'Assignment deleted successfully', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getSubmissionStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await assignmentService.getSubmissionStats(id);
      return ResponseUtil.success(res, 'Success', stats);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getAverageScore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const average = await assignmentService.getAverageScore(id);
      return ResponseUtil.success(res, 'Success', { average });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async duplicate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { targetLessonId } = req.body;
      const assignment = await assignmentService.duplicate(id, targetLessonId);
      return ResponseUtil.success(res, 'Assignment duplicated successfully', assignment, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}

export default new AssignmentController();
