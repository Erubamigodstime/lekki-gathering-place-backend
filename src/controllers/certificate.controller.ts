import { Request, Response } from 'express';
import certificateService from '../services/certificate.service';
import { ResponseUtil } from '../utils/response.util';

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
}

export default new CertificateController();
