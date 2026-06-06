import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { SUPPORTED_CURRENCIES } from '../../shared/utils/currency';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.nativeEnum(UserRole).optional().default(UserRole.EMPLOYEE),
  currency: z.string().refine((c) => SUPPORTED_CURRENCIES.includes(c), {
    message: 'Unsupported currency',
  }).optional().default('USD'),
  departmentId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
