import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError(`Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
}
