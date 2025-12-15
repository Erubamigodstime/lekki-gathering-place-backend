import { Response } from 'express';
import { ApiResponse } from '@/types';

export class ResponseUtil {
  static success<T>(res: Response, message: string, data?: T, statusCode = 200) {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, statusCode = 500, error?: string) {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T) {
    return this.success(res, message, data, 201);
  }

  static badRequest(res: Response, message: string, error?: string) {
    return this.error(res, message, 400, error);
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message: string) {
    return this.error(res, message, 409);
  }

  static validationError(res: Response, errors: any) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
}
