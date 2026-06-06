import { Request, Response, NextFunction } from 'express';
import { expenseService } from './expense.service';
import { sendSuccess } from '../../shared/utils/response';

export class ExpenseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expenseService.create(req.user!.userId, req.body);
      sendSuccess(res, expense, 201);
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await expenseService.list(req.user!.userId, req.query as any);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expenseService.getOne(req.user!.userId, req.params.id, req.user!.role);
      sendSuccess(res, expense);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expenseService.update(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, expense);
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await expenseService.delete(req.user!.userId, req.params.id);
      sendSuccess(res, { message: 'Expense deleted' });
    } catch (err) { next(err); }
  }

  async uploadAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'NO_FILE' } });
        return;
      }
      const att = await expenseService.addAttachment(req.user!.userId, req.params.id, req.file);
      sendSuccess(res, att, 201);
    } catch (err) { next(err); }
  }

  async deleteAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await expenseService.deleteAttachment(req.user!.userId, req.params.id, req.params.attachId, req.user!.role);
      sendSuccess(res, { message: 'Attachment deleted' });
    } catch (err) { next(err); }
  }

  async downloadAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = await expenseService.downloadAttachment(req.user!.userId, req.params.id, req.params.attachId, req.user!.role);
      res.redirect(url);
    } catch (err) { next(err); }
  }
}

export const expenseController = new ExpenseController();
