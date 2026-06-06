import { Router } from 'express';
import { expenseController } from './expense.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { uploadSingle } from '../../shared/middleware/upload.middleware';
import {
  createExpenseSchema, updateExpenseSchema, expenseQuerySchema,
  idParamSchema, attachmentParamSchema,
} from './expense.schemas';

export const expenseRouter = Router();

expenseRouter.use(authMiddleware);

expenseRouter.post(
  '/',
  validate({ body: createExpenseSchema }),
  expenseController.create.bind(expenseController),
);

expenseRouter.get(
  '/',
  validate({ query: expenseQuerySchema }),
  expenseController.list.bind(expenseController),
);

expenseRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  expenseController.getOne.bind(expenseController),
);

expenseRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateExpenseSchema }),
  expenseController.update.bind(expenseController),
);

expenseRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  expenseController.delete.bind(expenseController),
);

expenseRouter.post(
  '/:id/attachments',
  validate({ params: idParamSchema }),
  uploadSingle,
  expenseController.uploadAttachment.bind(expenseController),
);

expenseRouter.delete(
  '/:id/attachments/:attachId',
  validate({ params: attachmentParamSchema }),
  expenseController.deleteAttachment.bind(expenseController),
);

expenseRouter.get(
  '/:id/attachments/:attachId',
  validate({ params: attachmentParamSchema }),
  expenseController.downloadAttachment.bind(expenseController),
);
