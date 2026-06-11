// ============================================================
// DeskLine — Shared TypeScript Types
// ============================================================

// --- Enums ---

export type UserRole = 'employee' | 'agent' | 'supervisor' | 'admin'
export type Department = 'IT' | 'HR' | 'General'
export type TicketCategory = 'IT' | 'HR' | 'General'
export type TicketSubType = 'information' | 'action' | 'conversation' | 'escalation'
export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed'
export type NotificationType = 'ticket_update' | 'assignment' | 'escalation' | 'announcement' | 'cometchat'

// --- Domain Models ---

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: Department
  isActive: boolean
  fcmToken?: string | null
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  category: TicketCategory
  subType: TicketSubType
  priority: TicketPriority
  status: TicketStatus
  employeeId: string
  agentId?: string | null
  lastActivityAt?: string | null
  resolvedAt?: string | null
  resolutionConfirmationRequestedAt?: string | null
  closedAt?: string | null
  cometchatConvoId?: string | null
  createdAt: string
  updatedAt: string
  // Expanded relations (may be present on detail response)
  employee?: Pick<User, 'id' | 'name' | 'email' | 'department'>
  agent?: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  createdAt: string
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>
}

// --- API Response Shapes ---

export interface ApiMeta {
  total: number
  page: number
  pageSize: number
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiMeta
}

export interface ApiSingleResponse<T> {
  data: T
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

// --- Auth ---

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// --- Ticket Mutations ---

export interface CreateTicketPayload {
  title: string
  description: string
  category: TicketCategory
  subType: TicketSubType
  priority: TicketPriority
}

export interface UpdateTicketPayload {
  status?: TicketStatus
  agentId?: string
}

// --- Admin Mutations ---

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
  department: Department
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  department?: Department
}

// --- Ticket filter params ---

export interface TicketFilters {
  status?: TicketStatus
  subType?: TicketSubType
  category?: TicketCategory
  priority?: TicketPriority
  page?: number
  pageSize?: number
}

// --- User filter params ---

export interface UserFilters {
  role?: UserRole
  department?: Department
  page?: number
  pageSize?: number
}

// --- Activity log filter params ---

export interface ActivityLogFilters {
  userId?: string
  entityType?: string
  action?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface DashboardGroupCount {
  role?: string
  status?: string
  category?: string
  priority?: string
  _count: Record<string, number>
}

export interface AdminDashboardData {
  totals: {
    users: number
    tickets: number
    notifications: number
    unreadNotifications: number
    resolvedToday: number
  }
  usersByRole: DashboardGroupCount[]
  ticketsByStatus: DashboardGroupCount[]
  ticketsByDepartment: DashboardGroupCount[]
  ticketsByPriority: DashboardGroupCount[]
 }

export interface SupervisorDashboardData {
  openEscalations: number
  unassignedTickets: number
  resolvedToday: number
  agents: number
  department: string
}

export interface AgentMetricsData {
  assigned: number
  resolved: number
  escalated: number
  inProgress: number
  resolutionRate: number
}

// --- Valid status transitions map ---

export const VALID_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress'],
  in_progress: ['resolved', 'escalated'],
  escalated: ['resolved'],
  resolved: ['closed'],
  closed: [],
}

// --- Display label maps ---

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const SUBTYPE_LABELS: Record<TicketSubType, string> = {
  information: 'Information',
  action: 'Action',
  conversation: 'Conversation',
  escalation: 'Escalation',
}

export const SUBTYPE_DESCRIPTIONS: Record<TicketSubType, string> = {
  information: 'I need an answer to a question or explanation of a policy.',
  action: 'Something needs to be done — access granted, account created, etc.',
  conversation: 'I need to discuss a nuanced or unclear situation with an agent.',
  escalation: 'This is urgent or sensitive — payroll error, data breach, legal concern.',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'Employee',
  agent: 'Support Agent',
  supervisor: 'Supervisor',
  admin: 'Administrator',
}
