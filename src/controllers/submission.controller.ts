import { Request, Response } from 'express';
import submissionService from '../services/submission.service';
import { ResponseUtil } from '../utils/response.util';
import { CreateSubmissionDTO, UpdateSubmissionDTO } from '../types';

export class SubmissionController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateSubmissionDTO = req.body;
      const submission = await submissionService.create(data);
      return ResponseUtil.success(res, 'Submission created successfully', submission, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await submissionService.getById(id);
      if (!submission) return ResponseUtil.error(res, 'Submission not found', 404);
      return ResponseUtil.success(res, 'Success', submission);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByAssignment(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const latestOnly = req.query.latestOnly === 'true';
      const submissions = await submissionService.getByAssignment(assignmentId, latestOnly);
      return ResponseUtil.success(res, 'Success', submissions);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const status = req.query.status as string | undefined;
      const latestOnly = req.query.latestOnly === 'true'; // Default to false
      
      console.log('=== GET SUBMISSIONS BY CLASS ===');
      console.log('ClassId:', classId);
      console.log('Status filter:', status);
      console.log('LatestOnly:', latestOnly);
      
      const submissions = await submissionService.getByClass(classId, status as any, latestOnly);
      
      console.log('Submissions found:', submissions.length);
      console.log('Submissions details:', submissions.map(s => ({
        id: s.id,
        studentId: s.studentId,
        assignmentId: s.assignmentId,
        status: s.status,
        attemptNumber: s.attemptNumber,
        studentName: s.student?.user ? `${s.student.user.firstName} ${s.student.user.lastName}` : 'N/A',
        assignmentTitle: s.assignment?.title || 'N/A'
      })));
      
      return ResponseUtil.success(res, 'Success', submissions);
    } catch (error: any) {
      console.error('Error in getByClass:', error);
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getByStudent(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const classId = req.query.classId as string | undefined;
      const submissions = await submissionService.getByStudent(studentId, classId);
      return ResponseUtil.success(res, 'Success', submissions);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateSubmissionDTO = req.body;
      const submission = await submissionService.update(id, data);
      return ResponseUtil.success(res, 'Submission updated successfully', submission);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await submissionService.submit(id);
      return ResponseUtil.success(res, 'Submission submitted successfully', submission);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await submissionService.approve(id);
      return ResponseUtil.success(res, 'Submission approved successfully', submission);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await submissionService.reject(id);
      return ResponseUtil.success(res, 'Submission rejected', submission);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await submissionService.delete(id);
      return ResponseUtil.success(res, 'Submission deleted successfully', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const { assignmentId, studentId } = req.params;
      const history = await submissionService.getHistory(assignmentId, studentId);
      return ResponseUtil.success(res, 'Success', history);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}

export default new SubmissionController();
