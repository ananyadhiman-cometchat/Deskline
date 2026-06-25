import { TicketCategory, TicketStatus, TicketSubType } from '@prisma/client';
import { z } from 'zod';

export const ticketCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.nativeEnum(TicketCategory),
  subType: z.nativeEnum(TicketSubType),
  priority: z.enum(['low', 'medium', 'high'])
});

export const ticketUpdateSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  agentId: z.string().uuid().optional()
});

export const ticketListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(TicketStatus).optional(),
  subType: z.nativeEnum(TicketSubType).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  agentId: z.string().uuid().optional()
});