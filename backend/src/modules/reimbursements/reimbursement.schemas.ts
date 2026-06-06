import { z } from 'zod';

export const submitReimbursementSchema = z.object({
  expenseIds: z.array(z.string().uuid()).min(1).max(50),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  notes: z.string().max(500).optional(),
});

export const rejectSchema = z.object({
  rejectionReason: z.string().min(5).max(500),
});

export const reimbursementQuerySchema = z.object({
  status: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type SubmitReimbursementInput = z.infer<typeof submitReimbursementSchema>;
export type RejectInput = z.infer<typeof rejectSchema>;
export type ReimbursementQuery = z.infer<typeof reimbursementQuerySchema>;
