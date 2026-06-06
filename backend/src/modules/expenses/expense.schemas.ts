import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';
import { SUPPORTED_CURRENCIES } from '../../shared/utils/currency';

export const createExpenseSchema = z.object({
  title: z.string().min(2).max(200),
  amount: z.number().positive(),
  currency: z.string().refine((c) => SUPPORTED_CURRENCIES.includes(c), {
    message: 'Unsupported currency',
  }),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().max(1000).optional(),
  expenseDate: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const attachmentParamSchema = z.object({ id: z.string().uuid(), attachId: z.string().uuid() });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
