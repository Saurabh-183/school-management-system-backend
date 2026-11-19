import { z } from 'zod';
import { objectIdRegex } from './user.schema.js';

export const createSessionSchema = z
  .object({
    teacherId: z
      .string()
      .regex(objectIdRegex, 'Invalid teacherId ObjectId format'),
    startTime: z
      .string()
      .datetime({ message: 'startTime must be a valid ISO 8601 datetime string' }),
    endTime: z
      .string()
      .datetime({ message: 'endTime must be a valid ISO 8601 datetime string' }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      return end > start;
    },
    {
      message: 'endTime must be greater than startTime',
      path: ['endTime'],
    }
  );

export const getAvailableSessionsQuerySchema = z.object({
  dateTimestamp: z
    .string()
    .refine(
      (val) => {
        // Can be integer timestamp (seconds or ms) or ISO string
        if (/^\d+$/.test(val)) {
          const num = Number(val);
          return !isNaN(new Date(num > 1e11 ? num : num * 1000).getTime());
        }
        return !isNaN(new Date(val).getTime());
      },
      { message: 'dateTimestamp must be a valid timestamp (ms/seconds) or ISO date string' }
    ),
  page: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: 'page must be a positive integer',
    }),
  limit: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
      message: 'limit must be a positive integer',
    }),
  search: z.string().optional(),
});

export const bookSessionParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, 'Invalid Session ObjectId format'),
});

export const bookSessionBodySchema = z.object({
  userId: z
    .string()
    .regex(objectIdRegex, 'Invalid userId ObjectId format'),
});

export const completeSessionParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, 'Invalid Session ObjectId format'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type BookSessionBodyInput = z.infer<typeof bookSessionBodySchema>;
