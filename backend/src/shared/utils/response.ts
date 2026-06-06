import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: object): void {
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });
}

export function sendError(res: Response, message: string, statusCode = 500, code?: string): void {
  res.status(statusCode).json({ success: false, error: { message, ...(code && { code }) } });
}
