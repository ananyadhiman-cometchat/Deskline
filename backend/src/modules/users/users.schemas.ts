import { Department, UserRole } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  department: z.nativeEnum(Department),
  isActive: z.boolean().optional()
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z.string().min(8).optional()
  });

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.nativeEnum(UserRole).optional(),
  department: z.nativeEnum(Department).optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
});
