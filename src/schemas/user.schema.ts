import { z } from 'zod';

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address format'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number cannot exceed 20 characters'),
});

export const userIdParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, 'Invalid User ObjectId format'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
