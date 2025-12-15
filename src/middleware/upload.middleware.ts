import multer from 'multer';
import { Request } from 'express';
import { config } from '@/config';
import { AppError } from './error.middleware';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: any, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`,
        400
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter,
});
