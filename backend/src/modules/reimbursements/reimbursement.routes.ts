import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { reimbursementController } from './reimbursement.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  submitReimbursementSchema, rejectSchema, reimbursementQuerySchema, idParamSchema,
} from './reimbursement.schemas';

export const reimbursementRouter = Router();

reimbursementRouter.use(authMiddleware);

// Employee routes
reimbursementRouter.post(
  '/',
  authorize(UserRole.EMPLOYEE),
  validate({ body: submitReimbursementSchema }),
  reimbursementController.submit.bind(reimbursementController),
);

reimbursementRouter.get(
  '/',
  authorize(UserRole.EMPLOYEE),
  validate({ query: reimbursementQuerySchema }),
  reimbursementController.listMine.bind(reimbursementController),
);

// Employer routes
reimbursementRouter.get(
  '/pending',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate({ query: reimbursementQuerySchema }),
  reimbursementController.listPending.bind(reimbursementController),
);

// Shared (owner or employer)
reimbursementRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  reimbursementController.getOne.bind(reimbursementController),
);

reimbursementRouter.patch(
  '/:id/approve',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate({ params: idParamSchema }),
  reimbursementController.approve.bind(reimbursementController),
);

reimbursementRouter.patch(
  '/:id/reject',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate({ params: idParamSchema, body: rejectSchema }),
  reimbursementController.reject.bind(reimbursementController),
);
