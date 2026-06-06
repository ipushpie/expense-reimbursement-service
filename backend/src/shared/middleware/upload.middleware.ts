import multer from 'multer';
import { Request } from 'express';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../../config/constants';
import { ValidationError } from '../errors/AppError';

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type ${file.mimetype} not allowed. Use JPEG, PNG or PDF.`));
  }
}

export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('file');
