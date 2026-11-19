import { z } from 'zod';
import { objectIdRegex } from './user.schema.js';

export const createTeacherSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address format'),
  specialization: z
    .string()
    .trim()
    .min(2, 'Specialization must be at least 2 characters'),
  experience: z
    .number()
    .min(0, 'Experience cannot be negative'),
});

export const teacherIdParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, 'Invalid Teacher ObjectId format'),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
