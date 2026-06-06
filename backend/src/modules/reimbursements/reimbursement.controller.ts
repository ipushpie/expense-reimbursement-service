import { Request, Response, NextFunction } from 'express';
import { reimbursementService } from './reimbursement.service';
import { sendSuccess } from '../../shared/utils/response';

export class ReimbursementController {
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reimbursementService.submit(
        req.user!.userId,
        req.user!.currency,
        req.user!.departmentId,
        req.body,
      );
      sendSuccess(res, result, 201);
    } catch (err) { next(err); }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reimbursementService.list({ ...(req.query as any), employeeId: req.user!.userId });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async listPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reimbursementService.list({ ...(req.query as any), status: 'PENDING' });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reimbursementService.getOne(
        req.params.id, req.user!.userId, req.user!.role, req.user!.currency,
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reimbursementService.approve(
        req.user!.userId, req.user!.currency, req.params.id,
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reimbursementService.reject(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}

export const reimbursementController = new ReimbursementController();
