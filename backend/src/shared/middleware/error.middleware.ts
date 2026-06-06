import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    sendError(res, message, 400, 'VALIDATION_ERROR');
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with these details already exists', 409, 'CONFLICT');
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404, 'NOT_FOUND');
      return;
    }
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
}

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
}
