import { Request, Response } from 'express';
import lessonService from '../services/lesson.service';
import { ResponseUtil } from '../utils/response.util';
import { CreateLessonDTO, UpdateLessonDTO } from '../types';

export class LessonController {
  /**
   * Create a new lesson
   * POST /api/v1/lessons
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateLessonDTO = req.body;
      const lesson = await lessonService.create(data);
      
      return ResponseUtil.success(res, 'Lesson created successfully', lesson, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get lesson by ID
   * GET /api/v1/lessons/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const includeRelations = req.query.includeRelations === 'true';
      
      const lesson = await lessonService.getById(id, includeRelations);
      
      if (!lesson) {
        return ResponseUtil.error(res, 'Lesson not found', 404);
      }
      
      return ResponseUtil.success(res, 'Success', lesson);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get all lessons for a class
   * GET /api/v1/lessons/class/:classId
   */
  async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const includeUnpublished = req.query.includeUnpublished === 'true';
      
      const lessons = await lessonService.getByClass(classId, includeUnpublished);
      
      return ResponseUtil.success(res, 'Success', lessons);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get lesson by week number
   * GET /api/v1/lessons/class/:classId/week/:weekNumber
   */
  async getByWeek(req: Request, res: Response) {
    try {
      const { classId, weekNumber } = req.params;
      
      const lesson = await lessonService.getByWeek(classId, parseInt(weekNumber));
      
      if (!lesson) {
        return ResponseUtil.error(res, 'Lesson not found for this week', 404);
      }
      
      return ResponseUtil.success(res, 'Success', lesson);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Update a lesson
   * PUT /api/v1/lessons/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateLessonDTO = req.body;
      
      const lesson = await lessonService.update(id, data);
      
      return ResponseUtil.success(res, 'Lesson updated successfully', lesson);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Publish a lesson
   * POST /api/v1/lessons/:id/publish
   */
  async publish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const lesson = await lessonService.publish(id);
      
      return ResponseUtil.success(res, 'Lesson published successfully', lesson);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Unpublish a lesson
   * POST /api/v1/lessons/:id/unpublish
   */
  async unpublish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const lesson = await lessonService.unpublish(id);
      
      return ResponseUtil.success(res, 'Lesson unpublished successfully', lesson);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Delete a lesson
   * DELETE /api/v1/lessons/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await lessonService.delete(id);
      
      return ResponseUtil.success(res, 'Lesson deleted successfully', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get student progress for a lesson
   * GET /api/v1/lessons/:lessonId/progress/:studentId
   */
  async getStudentProgress(req: Request, res: Response) {
    try {
      const { lessonId, studentId } = req.params;
      
      const progress = await lessonService.getStudentProgress(lessonId, studentId);
      
      return ResponseUtil.success(res, 'Success', progress);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get completion statistics for a lesson
   * GET /api/v1/lessons/:lessonId/stats
   */
  async getCompletionStats(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      
      const stats = await lessonService.getCompletionStats(lessonId);
      
      return ResponseUtil.success(res, 'Success', stats);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
  /**
   * Mark lesson as complete for a student
   * POST /api/v1/lessons/:lessonId/complete
   */
  async markComplete(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const studentId = req.user?.id;

      if (!studentId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const completion = await lessonService.markComplete(lessonId, studentId);
      
      return ResponseUtil.success(res, 'Lesson marked as complete', completion);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Mark lesson as incomplete for a student
   * DELETE /api/v1/lessons/:lessonId/complete
   */
  async markIncomplete(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const studentId = req.user?.id;

      if (!studentId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      await lessonService.markIncomplete(lessonId, studentId);
      
      return ResponseUtil.success(res, 'Lesson marked as incomplete');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get student's completed lessons
   * GET /api/v1/lessons/student/completed
   */
  async getStudentCompletedLessons(req: Request, res: Response) {
    try {
      const studentId = req.user?.id;
      const { classId } = req.query;

      if (!studentId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const completedLessons = await lessonService.getStudentCompletedLessons(
        studentId,
        classId as string | undefined
      );
      
      return ResponseUtil.success(res, 'Success', completedLessons);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }}

export default new LessonController();
