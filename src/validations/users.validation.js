import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.preprocess(value => {
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      return Number(value);
    }
    return value;
  }, z.number().int().positive()),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).max(128).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
