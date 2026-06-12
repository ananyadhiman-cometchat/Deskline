# Tasks — DeskLine Flutter Mobile Application (Phase 1: Foundation & Core Infrastructure)

## Task 1: Initialize Flutter Project with Dependencies

- [x] Create Flutter project in `mobile_app/` directory inside `/Users/admin/Desktop/project/Deskline/`
- [x] Configure `pubspec.yaml` with all required dependencies: flutter_riverpod, go_router, dio, flutter_secure_storage, freezed, freezed_annotation, json_annotation, json_serializable, build_runner, flutter_form_builder, form_builder_validators
- [x] Set minimum Android SDK to 21, minimum iOS version to 12
- [x] Run `flutter pub get` to resolve dependencies
- [x] Verify project compiles without errors

Requirements addressed: REQ-1 (AC 1, 2, 3)

## Task 2: Set Up Folder Architecture

Depends on: Task 1

- [x] Create `lib/app/` directory with `app.dart` and `router.dart` placeholder files
- [x] Create `lib/core/theme/`, `lib/core/constants/`, `lib/core/networking/`, `lib/core/errors/`, `lib/core/widgets/` directories
- [x] Create `lib/features/auth/data/`, `lib/features/auth/providers/`, `lib/features/auth/presentation/` directories
- [x] Create `lib/features/tickets/data/`, `lib/features/tickets/providers/` directories
- [x] Create `lib/features/notifications/data/`, `lib/features/notifications/providers/` directories
- [x] Create `lib/features/admin/data/`, `lib/features/admin/providers/` directories
- [x] Create `lib/features/dashboard/`, `lib/features/profile/`, `lib/features/agent/`, `lib/features/supervisor/` directories
- [x] Create `lib/shared/models/`, `lib/shared/enums/`, `lib/shared/services/` directories
- [x] Update `lib/main.dart` to use ProviderScope wrapper

Requirements addressed: REQ-1 (AC 3), REQ-3 (AC 1-5)

## Task 3: Implement Design System (Theme, Colors, Typography, Spacing)

Depends on: Task 2

- [x] Create `lib/core/theme/color_scheme.dart` with AppColors class (primaryRed #FF4655, navy #0F1923, white #FFFFFF, secondaryBackground #F7F7F7, border #E5E7EB, mutedText #6B7280, statusColors)
- [x] Create `lib/core/theme/typography.dart` with AppTypography class (heroHeadline, sectionHeadline, navigationLabel, sectionLabel, body, badge, metricValue using Inter font)
- [x] Create `lib/core/theme/spacing.dart` with AppSpacing class (xxs=4, xs=8, sm=12, md=16, lg=24, xl=32, xxl=48)
- [x] Create `lib/core/theme/app_theme.dart` building full Material 3 ThemeData: colorScheme, textTheme, elevatedButtonTheme (0px border radius, 48px height), outlinedButtonTheme, inputDecorationTheme, appBarTheme, cardTheme (0px radius, border instead of elevation), dividerTheme
- [x] Create `lib/core/constants/dimensions.dart` with border radius (0-2px max), icon sizes, card dimensions
- [x] Create `lib/core/constants/durations.dart` with animation timing constants

Requirements addressed: REQ-2 (AC 1-10)

## Task 4: Define Shared Enums

Depends on: Task 2

- [x] Create `lib/shared/enums/user_role.dart` with UserRole enum (employee, agent, supervisor, admin) with JsonValue annotations
- [x] Create `lib/shared/enums/department.dart` with Department enum (it, hr, general) with JsonValue annotations
- [x] Create `lib/shared/enums/ticket_status.dart` with TicketStatus enum (open, inProgress, escalated, resolved, closed) with JsonValue annotations
- [x] Create `lib/shared/enums/ticket_category.dart` with TicketCategory enum (it, hr, general) with JsonValue annotations
- [x] Create `lib/shared/enums/ticket_subtype.dart` with TicketSubtype enum (information, action, conversation, escalation) with JsonValue annotations
- [x] Create `lib/shared/enums/ticket_priority.dart` with TicketPriority enum (low, medium, high) with JsonValue annotations
- [x] Create `lib/shared/enums/notification_type.dart` with NotificationType enum (ticketUpdate, assignment, escalation, announcement) with JsonValue annotations
- [x] Create `lib/shared/enums/enums.dart` barrel export file

Requirements addressed: REQ-3 (AC 1-5)

## Task 5: Define Shared Data Models (Freezed)

Depends on: Task 4

- [x] Create `lib/shared/models/user.dart` with freezed User model (id, name, email, role, department, isActive, createdAt, updatedAt)
- [x] Create `lib/shared/models/ticket.dart` with freezed Ticket model (id, title, description, category, subType, priority, status, employeeId, agentId nullable, lastActivityAt nullable, createdAt, updatedAt)
- [x] Create `lib/shared/models/notification_model.dart` with freezed AppNotification model (id, userId, type, title, body, isRead, createdAt)
- [x] Create `lib/shared/models/activity_log.dart` with freezed ActivityLog model (id, userId, action, entityType, entityId, metadata Map, createdAt)
- [x] Create `lib/shared/models/auth_response.dart` with freezed AuthResponse model (user, accessToken, refreshToken)
- [x] Create `lib/shared/models/pagination_meta.dart` with freezed PaginationMeta model (total, page, pageSize)
- [x] Create `lib/shared/models/paginated_response.dart` with PaginatedResponse generic class (data List, meta PaginationMeta)
- [x] Create `lib/shared/models/agent_workload.dart` with freezed AgentWorkload model (userId, name, department, openCount, inProgressCount, resolvedCount)
- [x] Create `lib/shared/models/ticket_analytics.dart` with freezed TicketAnalytics model (totalTickets, activeTickets, resolvedTickets, escalatedTickets, totalUsers, byCategory Map, byStatus Map, byDepartment Map)
- [x] Run `dart run build_runner build --delete-conflicting-outputs` to generate freezed/json code
- [x] Create `lib/shared/models/models.dart` barrel export file

Requirements addressed: REQ-3 (AC 1-5, 7)

## Task 6: Define Repository Interfaces

Depends on: Task 5

- [x] Create `lib/features/auth/data/auth_repository.dart` with abstract AuthRepository (login, register, logout, getCurrentUser)
- [x] Create `lib/features/tickets/data/ticket_repository.dart` with abstract TicketRepository (createTicket, getTickets with pagination/filters, getTicketById, updateTicketStatus, escalateTicket, reassignTicket)
- [x] Create `lib/features/notifications/data/notification_repository.dart` with abstract NotificationRepository (getNotifications with pagination/filters, markAsRead, markAllAsRead, getUnreadCount)
- [x] Create `lib/features/admin/data/user_repository.dart` with abstract UserRepository (getUsers with pagination/filters, getUserById, updateUser, deactivateUser)
- [x] Create `lib/features/admin/data/admin_repository.dart` with abstract AdminRepository (createUser, getActivityLogs, getNotificationLogs, getTicketAnalytics, getAgentWorkload)

Requirements addressed: REQ-3 (AC 1-5, 9, 10)

## Task 7: Implement Mock Repositories

Depends on: Task 6

- [x] Create `lib/features/auth/data/mock_auth_repository.dart` implementing AuthRepository with hardcoded users (one per role), simulated 500ms delay, token generation
- [x] Create `lib/features/tickets/data/mock_ticket_repository.dart` implementing TicketRepository with 20+ mock tickets across all statuses/categories/subtypes, fake pagination, filter logic
- [x] Create `lib/features/notifications/data/mock_notification_repository.dart` implementing NotificationRepository with mock notifications, read/unread states, pagination
- [x] Create `lib/features/admin/data/mock_user_repository.dart` implementing UserRepository with 15+ mock users across roles/departments, filter/search logic, pagination
- [x] Create `lib/features/admin/data/mock_admin_repository.dart` implementing AdminRepository with mock activity logs, notification logs, analytics data, agent workload

Requirements addressed: REQ-3 (AC 6, 7, 8)

## Task 8: Set Up Riverpod Providers for Repository Injection

Depends on: Task 7

- [x] Create `lib/features/auth/providers/auth_provider.dart` with authRepositoryProvider (provides MockAuthRepository), authStateProvider (StateNotifier managing auth state)
- [x] Create `lib/features/tickets/providers/ticket_provider.dart` with ticketRepositoryProvider (provides MockTicketRepository)
- [x] Create `lib/features/notifications/providers/notification_provider.dart` with notificationRepositoryProvider (provides MockNotificationRepository)
- [x] Create `lib/features/admin/providers/user_provider.dart` with userRepositoryProvider (provides MockUserRepository)
- [x] Create `lib/features/admin/providers/admin_provider.dart` with adminRepositoryProvider (provides MockAdminRepository)
- [x] Verify all providers compile without errors

Requirements addressed: REQ-3 (AC 8, 9), REQ-25 (AC 8)

## Task 9: Configure GoRouter with Role-Based Routing Foundation

Depends on: Task 8

- [x] Create `lib/app/router.dart` with GoRouter configuration: login route, register route, role-based shell routes (/employee/*, /agent/*, /supervisor/*, /admin/*)
- [x] Implement auth redirect guard: unauthenticated users redirected to /login, authenticated users on /login redirected to role-appropriate dashboard
- [x] Implement role-based route guard: users accessing routes outside their role get redirected to their dashboard
- [x] Create placeholder screen widgets for each role dashboard (simple text showing role name)
- [x] Update `lib/app/app.dart` with MaterialApp.router using the GoRouter instance, applying AppTheme
- [x] Update `lib/main.dart` to launch the App widget within ProviderScope

Requirements addressed: REQ-25 (AC 1-9), REQ-4 (AC 5)

## Task 10: Create Core Utility Classes

Depends on: Task 3

- [x] Create `lib/core/errors/app_exception.dart` with exception classes: AppException, AuthException, ValidationException, NotFoundException, PermissionException, NetworkException
- [x] Create `lib/core/errors/error_handler.dart` with utility to convert exceptions to user-friendly error messages
- [x] Create `lib/core/networking/api_endpoints.dart` with all backend endpoint URL constants (for future Phase 2 use)
- [x] Create `lib/core/networking/dio_client.dart` as a stub Dio client setup with base configuration (interceptors placeholder, base URL from constants)
- [x] Create `lib/shared/services/secure_storage_service.dart` wrapping flutter_secure_storage with methods: saveToken, getToken, deleteToken, saveUser, getUser, deleteUser, clearAll

Requirements addressed: REQ-3 (AC 10), REQ-4 (AC 3, 8)

## Task 11: Create Core Widget Components

Depends on: Task 3

- [x] Create `lib/core/widgets/app_button.dart` — primary (red bg, white text) and secondary (white bg, navy border) buttons with 0px border radius, 48px height, uppercase labels, loading state
- [x] Create `lib/core/widgets/app_text_field.dart` — styled text input with 0px border radius, red focus border, uppercase label, validation error display
- [x] Create `lib/core/widgets/status_badge.dart` — compact badge with 0px border radius, configurable background/text color, uppercase text
- [x] Create `lib/core/widgets/metric_card.dart` — border-driven card (no shadows) with label, value, optional icon, tap handler
- [x] Create `lib/core/widgets/section_header.dart` — uppercase label with red bottom border, proper letter spacing
- [x] Create `lib/core/widgets/empty_state.dart` — centered message with optional icon for no-data screens
- [x] Create `lib/core/widgets/widgets.dart` barrel export file

Requirements addressed: REQ-2 (AC 1-10), REQ-5 (AC 1-4)

## Phase 2: Shared Components

### Completed Components

- **Layout Components**
  - `AppShell` — outer container with padding, safe areas
  - `RoleAwareScaffold` — role-specific navigation (bottom nav on mobile, drawer on tablet)
  - `DataTableCard` — border-driven table component

- **Ticket Components**
  - `TicketCard` — ticket summary with badges
  - `TicketStatusBadge`, `TicketPriorityBadge`, `TicketCategoryBadge`, `TicketSubtypeBadge`
  - `TicketTimeline` — visual status history
  - `AssignmentCard` — agent assignment display with reassign action
  - `AIResponsePanel` — placeholder for AI responses (information subtype)
  - `TicketListView` — filtered list with pull-to-refresh

- **Admin Components**
  - `UserTable` — user management table
  - `ActivityLogTable` — activity log display
  - `AnalyticsCards` — system-wide metrics and distributions

- **Authentication Screens**
  - `LoginScreen` — email/password validation, loading/error states
  - `RegisterScreen` — name, email, password, department, validation

### Status

Phase 2 is complete with all shared components implemented. Visible UI includes:
- Login/Register screens with validation
- Role-based dashboards (placeholder)
- Reusable ticket cards, badges, and timeline
- User and activity tables
- Analytics cards with distributions

### Next Steps (Phase 3: Authentication Module)

- Implement full login flow with token storage
- Implement register flow with department selection
- Secure storage integration for tokens
- Auth guards for protected routes
