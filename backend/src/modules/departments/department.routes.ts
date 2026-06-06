import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { departmentRepository } from './department.repository';
import { reimbursementRepository } from '../reimbursements/reimbursement.repository';
import { convertAmount, toUSD } from '../../shared/utils/currency';
import { sendSuccess } from '../../shared/utils/response';
import { NotFoundError } from '../../shared/errors/AppError';
import { createDepartmentSchema, budgetQuerySchema, idParamSchema } from './department.schemas';

export const departmentRouter = Router();

departmentRouter.use(authMiddleware);

departmentRouter.get(
  '/',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const depts = await departmentRepository.findAll();
      sendSuccess(res, depts);
    } catch (err) { next(err); }
  },
);

departmentRouter.post(
  '/',
  authorize(UserRole.ADMIN),
  validate({ body: createDepartmentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dept = await departmentRepository.create(req.body);
      sendSuccess(res, dept, 201);
    } catch (err) { next(err); }
  },
);

departmentRouter.get(
  '/:id/budget',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate({ params: idParamSchema, query: budgetQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dept = await departmentRepository.findById(req.params.id);
      if (!dept) throw new NotFoundError('Department');

      const { month, year } = req.query as any;
      const agg = await reimbursementRepository.getApprovedTotalForDept(dept.id, month, year);
      const approvedUSD = Number(agg._sum.totalAmountUSD ?? 0);
      const budgetUSD = toUSD(Number(dept.monthlyBudget), dept.currency);
      const employerCurrency = req.user!.currency;

      sendSuccess(res, {
        department: { id: dept.id, name: dept.name },
        month, year,
        budget: {
          amount: Number(dept.monthlyBudget),
          currency: dept.currency,
          amountUSD: budgetUSD,
          inEmployerCurrency: convertAmount(budgetUSD, 'USD', employerCurrency),
          employerCurrency,
        },
        approved: {
          amountUSD: approvedUSD,
          inEmployerCurrency: convertAmount(approvedUSD, 'USD', employerCurrency),
          employerCurrency,
        },
        remaining: {
          amountUSD: Math.max(0, budgetUSD - approvedUSD),
          inEmployerCurrency: convertAmount(Math.max(0, budgetUSD - approvedUSD), 'USD', employerCurrency),
        },
        overBudget: approvedUSD > budgetUSD,
      });
    } catch (err) { next(err); }
  },
);
