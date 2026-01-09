import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ResponseUtil } from '@/utils/response.util';
import { authenticate } from './auth.middleware';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return ResponseUtil.validationError(res, errors);
      }
      return ResponseUtil.badRequest(res, 'Invalid request data');
    }
  };
};

export const authMiddleware = authenticate;
