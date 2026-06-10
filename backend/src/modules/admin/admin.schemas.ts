import { z } from 'zod';

export const adminListQuerySchema=z.object({
 page:z.coerce.number().int().positive().default(1),
 pageSize:z.coerce.number().int().positive().max(100).default(20),
 from:z.string().optional(),
 to:z.string().optional()
});

export const activityLogQuerySchema=adminListQuerySchema.extend({
 userId:z.string().optional(),
 action:z.string().optional(),
 entityType:z.string().optional()
});

export const notificationLogQuerySchema=adminListQuerySchema.extend({
 type:z.string().optional(),
 isRead:z.enum(['true','false']).optional()
});