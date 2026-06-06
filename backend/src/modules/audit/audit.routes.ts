import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { auditRepository } from './audit.repository';
import { sendSuccess } from '../../shared/utils/response';

const querySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const auditRouter = Router();

auditRouter.use(authMiddleware);
auditRouter.use(authorize(UserRole.EMPLOYER, UserRole.ADMIN));

auditRouter.get(
  '/',
  validate({ query: querySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as any;
      const [logs, total] = await auditRepository.findMany({
        ...q,
        from: q.from ? new Date(q.from) : undefined,
        to: q.to ? new Date(q.to) : undefined,
      });
      sendSuccess(res, logs, 200, {
        total,
        page: q.page,
        limit: q.limit,
        totalPages: Math.ceil(total / q.limit),
      });
    } catch (err) { next(err); }
  },
);
