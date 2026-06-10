import { z } from 'zod'

// ============================================================
// DeskLine — Zod Validation Schemas
// Must mirror backend validation exactly.
// ============================================================

// --- Auth ---

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.enum(['IT', 'HR', 'General']),
})

// --- Tickets ---

export const ticketCreateSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or less'),
  category: z.enum(['IT', 'HR', 'General']),
  subType: z.enum(['information', 'action', 'conversation', 'escalation']),
  priority: z.enum(['low', 'medium', 'high']),
})

export const ticketStatusUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'escalated', 'resolved', 'closed']),
  agentId: z.string().uuid().optional(),
})

// --- Admin: User Management ---

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['employee', 'agent', 'supervisor', 'admin']),
  department: z.enum(['IT', 'HR', 'General']),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['employee', 'agent', 'supervisor', 'admin']).optional(),
  department: z.enum(['IT', 'HR', 'General']).optional(),
})

// --- Profile ---

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
})

// --- Inferred types ---

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type TicketCreateFormValues = z.infer<typeof ticketCreateSchema>
export type TicketStatusUpdateFormValues = z.infer<typeof ticketStatusUpdateSchema>
export type UserCreateFormValues = z.infer<typeof userCreateSchema>
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>
