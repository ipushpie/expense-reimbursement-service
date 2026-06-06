import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '../../shared/utils/currency';

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  monthlyBudget: z.number().positive(),
  currency: z.string().refine((c) => SUPPORTED_CURRENCIES.includes(c), {
    message: 'Unsupported currency',
  }).default('USD'),
});

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
