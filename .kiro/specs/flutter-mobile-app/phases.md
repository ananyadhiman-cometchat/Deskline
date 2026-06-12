Phase 1: Foundation & Core Infrastructure
Initialize Flutter project with dependencies (Riverpod, GoRouter, Dio, flutter_secure_storage, freezed)
Set up folder architecture (lib/app, lib/core, lib/features, lib/shared)
Implement Design System (theme, colors, typography, spacing tokens)
Create repository interfaces (Auth, Ticket, Notification, User, Admin)
Set up mock repository implementations with fake data
Configure GoRouter with role-based routing foundation
Phase 2: Shared Components
Layout components (AppShell, RoleAwareScaffold, SectionHeader, MetricCard, DataTableCard, EmptyState)
Ticket components (TicketCard, StatusBadge, PriorityBadge, TicketTimeline, AssignmentCard, ActivityTimeline)
Admin components (UserTable, ActivityLogTable, NotificationLogTable, AnalyticsCards)
Form components and validators
Phase 3: Authentication Module
Login screen (email, password, validation, error states)
Register screen (name, email, password, department)
Auth state management with Riverpod
Secure token storage
Auth guards for protected routes
Phase 4: Employee Features
Employee Dashboard (active tickets, recent tickets, notifications, raise ticket CTA)
Raise Ticket Form (title, description, category, subtype, priority validation)
Ticket List with filters (open, in progress, resolved, closed)
Ticket Detail View (metadata, status timeline, assigned agent, activity history, AI response panel)
Notification Centre (date grouping, read state, filters)
Profile screen (view/edit user info)
Phase 5: Agent Features
Agent Dashboard (assigned tickets, resolution metrics, new assignments)
Agent Inbox with filters (status, category, subtype)
Agent Ticket Detail Actions (status update controls, escalate action)
Activity logging integration
Phase 6: Supervisor Features
Supervisor Dashboard (open tickets, escalations, team metrics)
All Tickets View (global search, filters, assignment controls)
Escalation Queue (escalated-only filter, priority indicators)
Agent Load View (agent list with open/resolved counts)
Ticket reassignment functionality
Phase 7: Admin Features
Admin Dashboard (system-wide metrics: total/active/resolved/escalated tickets, user count)
User Management (user table, create/edit/deactivate users)
Activity Logs (search, filters, timeline view)
Notification Logs (notification history, filters)
Analytics (ticket distribution by category/status/department)
Phase 8: Polish & Optimization
Push notifications with FCM integration
Responsive layout testing (iPhone SE → iPad)
Accessibility audit (screen readers, dynamic type, color contrast)
Performance optimization
Error handling refinement
Pull-to-refresh for all data views


remaining
phase 4
phase 5
add back buttons , proofile button and logout 
phase 6
phase 7 
