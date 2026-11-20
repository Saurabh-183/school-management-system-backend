import { z } from 'zod';
import { ROLES } from '../constants/index.js';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(7, 'Phone number must be at least 7 characters'),
  role: z.enum([ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN]).optional().default(ROLES.STUDENT),
  teacherId: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
