# Design Document — DeskLine Flutter Mobile Application (Phase 1: Foundation & Core Infrastructure)

## Overview

The DeskLine Flutter mobile application is a cross-platform native mobile client targeting Android (API level 21+) and iOS (iOS 12+) from a unified codebase. Phase 1 establishes the foundational architecture, design system, and mock data layer that enables parallel UI development while backend integration is prepared for Phase 2.

This design focuses exclusively on Phase 1 scope:
- Flutter project initialization with core dependencies
- Folder architecture following feature-based organization
- Design system implementation matching Valorant-inspired enterprise SaaS visual language
- Repository pattern interfaces for data abstraction
- Mock repository implementations with realistic fake data
- Role-based routing foundation using GoRouter

Phase 1 deliberately excludes implementation of actual screens and business logic—those belong to subsequent phases. The goal is to establish a solid technical foundation that subsequent phases can build upon without architectural refactoring.

### Design Philosophy

**Separation of Concerns**: The repository pattern creates a hard boundary between UI and data access, enabling mock data development and future API integration without UI changes.

**Design System First**: Implementing the complete design system upfront ensures visual consistency as screens are added in later phases.

**Type Safety**: Using freezed, json_serializable, and strong typing throughout prevents runtime errors and improves developer experience.

**Role-Based Architecture**: The navigation and component structure is designed from the ground up to support four distinct user roles with different permissions and workflows.

### Key Architectural Decisions

1. **Repository Pattern**: All data access goes through abstract repository interfaces, allowing mock implementations now and API implementations later without changing consumer code.

2. **Riverpod for DI**: Riverpod provides compile-time safe dependency injection, making it trivial to swap mock repositories for real ones.

3. **GoRouter for Navigation**: Declarative routing with built-in support for nested navigation, guards, and redirects makes role-based access control straightforward.

4. **Material 3 Base**: Starting with Material 3 provides modern components while customization aligns with the Design System specifications.

5. **Freezed Models**: Immutable data models with built-in equality, copyWith, and JSON serialization reduce boilerplate and bugs.

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth UI    │  │  Employee UI │  │   Agent UI   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Supervisor UI │  │   Admin UI   │  │  Shared UI   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     State Management Layer                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Riverpod Providers (DI & State)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Repository Interfaces (Abstract)            │  │
│  │  • AuthRepository                                     │  │
│  │  • TicketRepository                                   │  │
│  │  • NotificationRepository                             │  │
│  │  • UserRepository                                     │  │
│  │  • AdminRepository                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Mock Repositories   │  │  Future: API Repos   │        │
│  │  (Phase 1)           │  │  (Phase 2+)          │        │
│  │  • Hardcoded data    │  │  • Dio HTTP client   │        │
│  │  • Fake pagination   │  │  • Token management  │        │
│  │  • Simulated delays  │  │  • Error handling    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Secure       │  │ Local Cache  │  │ FCM (Future) │     │
│  │ Storage      │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Presentation Layer**: Flutter widgets, screens, and UI components. Consumes repository interfaces through Riverpod providers. No business logic or data fetching logic resides here.

**State Management Layer**: Riverpod providers manage authentication state, loading states, error states, and provide dependency injection for repositories.

**Business Logic Layer**: Abstract repository interfaces define contracts for data operations. All UI code depends on these interfaces, not concrete implementations.


**Data Access Layer**: Concrete repository implementations. Phase 1 uses mock implementations with hardcoded data. Phase 2+ will add API-backed implementations using Dio.

**Infrastructure Layer**: Platform services like secure storage, caching, and push notifications. Phase 1 includes secure storage setup; FCM integration comes later.

### Folder Structure

```
mobile_app/
├── android/                      # Android platform files
├── ios/                          # iOS platform files
├── lib/
│   ├── app/
│   │   ├── app.dart             # Root app widget
│   │   └── router.dart          # GoRouter configuration
│   ├── core/
│   │   ├── theme/
│   │   │   ├── app_theme.dart        # Material 3 theme customization
│   │   │   ├── color_scheme.dart     # Design system colors
│   │   │   ├── typography.dart       # Text styles
│   │   │   └── spacing.dart          # Spacing tokens
│   │   ├── constants/
│   │   │   ├── dimensions.dart       # Layout dimensions
│   │   │   └── durations.dart        # Animation durations
│   │   ├── networking/
│   │   │   ├── dio_client.dart       # HTTP client (stub for Phase 1)
│   │   │   └── api_endpoints.dart    # Backend endpoint URLs
│   │   ├── errors/
│   │   │   ├── app_exception.dart    # Custom exception classes
│   │   │   └── error_handler.dart    # Error handling utilities
│   │   └── widgets/
│   │       ├── app_button.dart       # Styled buttons
│   │       ├── app_text_field.dart   # Styled text inputs
│   │       ├── status_badge.dart     # Badge component
│   │       └── metric_card.dart      # Dashboard metric cards
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── auth_repository.dart      # Interface
│   │   │   │   └── mock_auth_repository.dart # Mock impl
│   │   │   ├── providers/
│   │   │   │   └── auth_provider.dart        # Riverpod providers
│   │   │   └── presentation/                 # (Future phases)
│   │   ├── dashboard/                        # (Future phases)
│   │   ├── tickets/
│   │   │   ├── data/
│   │   │   │   ├── ticket_repository.dart
│   │   │   │   └── mock_ticket_repository.dart
│   │   │   └── providers/
│   │   │       └── ticket_provider.dart
│   │   ├── notifications/
│   │   │   ├── data/
│   │   │   │   ├── notification_repository.dart
│   │   │   │   └── mock_notification_repository.dart
│   │   │   └── providers/
│   │   │       └── notification_provider.dart
│   │   ├── profile/                          # (Future phases)
│   │   ├── agent/                            # (Future phases)
│   │   ├── supervisor/                       # (Future phases)
│   │   └── admin/
│   │       ├── data/
│   │       │   ├── user_repository.dart
│   │       │   ├── admin_repository.dart
│   │       │   ├── mock_user_repository.dart
│   │       │   └── mock_admin_repository.dart
│   │       └── providers/
│   │           ├── user_provider.dart
│   │           └── admin_provider.dart
│   ├── shared/
│   │   ├── models/
│   │   │   ├── user.dart                # Freezed model
│   │   │   ├── ticket.dart              # Freezed model
│   │   │   ├── notification.dart        # Freezed model
│   │   │   ├── activity_log.dart        # Freezed model
│   │   │   ├── api_response.dart        # Generic response wrapper
│   │   │   └── pagination_meta.dart     # Pagination metadata
│   │   ├── enums/
│   │   │   ├── user_role.dart
│   │   │   ├── department.dart
│   │   │   ├── ticket_status.dart
│   │   │   ├── ticket_category.dart
│   │   │   ├── ticket_subtype.dart
│   │   │   ├── ticket_priority.dart
│   │   │   └── notification_type.dart
│   │   └── services/
│   │       └── secure_storage_service.dart   # Token storage
│   └── main.dart                             # App entry point
├── pubspec.yaml                              # Dependencies
└── README.md                                 # Setup instructions
```


### Organization Principles

**Feature-Based Structure**: Each feature (auth, tickets, notifications, admin) has its own folder with data, providers, and presentation layers.

**Layer Isolation**: Data repositories are separated from providers, and providers are separated from presentation. This makes testing and mocking straightforward.

**Shared Resources**: Models, enums, and services used across features live in `shared/` to avoid circular dependencies.

**Core Infrastructure**: Theme, networking, errors, and reusable widgets live in `core/` and are available to all features.

## Components and Interfaces

### Repository Interfaces

All repository interfaces define async methods returning `Future<T>` or `Future<List<T>>`. Error handling is done through thrown exceptions that are caught at the provider layer.

#### AuthRepository Interface

```dart
abstract class AuthRepository {
  /// Authenticates user with email and password
  /// Returns authenticated user profile with tokens
  /// Throws [AuthException] on invalid credentials
  Future<AuthResponse> login(String email, String password);
  
  /// Registers new user with default employee role
  /// Returns created user profile
  /// Throws [ValidationException] on invalid input
  Future<User> register({
    required String name,
    required String email,
    required String password,
    required Department department,
  });
  
  /// Invalidates current session
  /// Throws [AuthException] on failure
  Future<void> logout();
  
  /// Retrieves authenticated user profile
  /// Throws [AuthException] if not authenticated
  Future<User> getCurrentUser();
}
```

#### TicketRepository Interface

```dart
abstract class TicketRepository {
  /// Creates new ticket
  /// Returns created ticket with generated ID
  /// Throws [ValidationException] on invalid input
  Future<Ticket> createTicket({
    required String title,
    required String description,
    required TicketCategory category,
    required TicketSubtype subtype,
    required TicketPriority priority,
  });
  
  /// Retrieves paginated list of tickets
  /// Applies filters for role-based access
  /// Returns paginated response with metadata
  Future<PaginatedResponse<Ticket>> getTickets({
    int page = 1,
    int pageSize = 20,
    TicketStatus? status,
    TicketCategory? category,
    TicketSubtype? subtype,
    String? assignedToUserId,
  });
  
  /// Retrieves single ticket by ID
  /// Throws [NotFoundException] if ticket doesn't exist
  Future<Ticket> getTicketById(String ticketId);
  
  /// Updates ticket status
  /// Validates state transition rules
  /// Throws [ValidationException] on invalid transition
  Future<Ticket> updateTicketStatus(String ticketId, TicketStatus newStatus);
  
  /// Escalates ticket to supervisor queue
  /// Changes subtype to escalation
  /// Throws [ValidationException] if already escalated
  Future<Ticket> escalateTicket(String ticketId);
  
  /// Reassigns ticket to different agent (supervisor only)
  /// Throws [PermissionException] if user lacks permission
  Future<Ticket> reassignTicket(String ticketId, String newAgentId);
}
```


#### NotificationRepository Interface

```dart
abstract class NotificationRepository {
  /// Retrieves paginated list of notifications for current user
  /// Returns paginated response with metadata
  Future<PaginatedResponse<Notification>> getNotifications({
    int page = 1,
    int pageSize = 20,
    bool? isRead,
    NotificationType? type,
  });
  
  /// Marks notification as read
  /// Throws [NotFoundException] if notification doesn't exist
  Future<void> markAsRead(String notificationId);
  
  /// Marks all notifications as read for current user
  Future<void> markAllAsRead();
  
  /// Gets count of unread notifications
  Future<int> getUnreadCount();
}
```

#### UserRepository Interface

```dart
abstract class UserRepository {
  /// Retrieves paginated list of users (admin only)
  /// Returns paginated response with metadata
  /// Throws [PermissionException] if user lacks permission
  Future<PaginatedResponse<User>> getUsers({
    int page = 1,
    int pageSize = 20,
    UserRole? role,
    Department? department,
    bool? isActive,
  });
  
  /// Retrieves single user by ID
  /// Throws [NotFoundException] if user doesn't exist
  Future<User> getUserById(String userId);
  
  /// Updates user profile (name only for self, all fields for admin)
  /// Throws [ValidationException] on invalid input
  Future<User> updateUser(String userId, {
    String? name,
    UserRole? role,
    Department? department,
  });
  
  /// Deactivates user account (admin only)
  /// Throws [PermissionException] if user lacks permission
  Future<void> deactivateUser(String userId);
}
```

#### AdminRepository Interface

```dart
abstract class AdminRepository {
  /// Creates new user (admin only)
  /// Returns created user with generated ID
  /// Throws [PermissionException] if user lacks permission
  /// Throws [ValidationException] on invalid input
  Future<User> createUser({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  });
  
  /// Retrieves paginated activity logs
  /// Returns paginated response with metadata
  /// Throws [PermissionException] if user lacks permission
  Future<PaginatedResponse<ActivityLog>> getActivityLogs({
    int page = 1,
    int pageSize = 20,
    String? userId,
    String? action,
    DateTime? startDate,
    DateTime? endDate,
  });
  
  /// Retrieves paginated notification logs
  /// Returns paginated response with metadata
  /// Throws [PermissionException] if user lacks permission
  Future<PaginatedResponse<Notification>> getNotificationLogs({
    int page = 1,
    int pageSize = 20,
    NotificationType? type,
    DateTime? startDate,
    DateTime? endDate,
  });
  
  /// Retrieves ticket analytics for dashboard
  /// Returns aggregated metrics
  /// Throws [PermissionException] if user lacks permission
  Future<TicketAnalytics> getTicketAnalytics({
    DateTime? startDate,
    DateTime? endDate,
  });
  
  /// Retrieves agent workload metrics
  /// Returns list of agents with ticket counts
  /// Throws [PermissionException] if user lacks permission
  Future<List<AgentWorkload>> getAgentWorkload();
}
```


### Riverpod Provider Architecture

Providers manage dependency injection and state. Phase 1 sets up the provider structure with mock repository injection.

#### Provider Types

**Repository Providers**: Singleton providers that instantiate and provide repository implementations.

```dart
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return MockAuthRepository();  // Phase 1: Mock
  // Phase 2+: return ApiAuthRepository(ref.watch(dioClientProvider));
});

final ticketRepositoryProvider = Provider<TicketRepository>((ref) {
  return MockTicketRepository();
});

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return MockNotificationRepository();
});

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return MockUserRepository();
});

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return MockAdminRepository();
});
```

**State Providers**: Manage authentication state and user session.

```dart
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});
```

### GoRouter Configuration

Phase 1 establishes the routing foundation with role-based guards. Actual screen implementations come in later phases.

```dart
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    redirect: (context, state) {
      final isAuthenticated = authState is AuthenticatedState;
      final isLoginRoute = state.location == '/login';
      
      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }
      
      if (isAuthenticated && isLoginRoute) {
        // Redirect to role-appropriate dashboard
        final user = (authState as AuthenticatedState).user;
        return _getDashboardRouteForRole(user.role);
      }
      
      return null; // No redirect
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(),  // Phase 2+
      ),
      GoRoute(
        path: '/employee',
        builder: (context, state) => EmployeeDashboard(),  // Phase 2+
        redirect: (context, state) => _checkRole(ref, UserRole.employee),
      ),
      GoRoute(
        path: '/agent',
        builder: (context, state) => AgentDashboard(),  // Phase 2+
        redirect: (context, state) => _checkRole(ref, UserRole.agent),
      ),
      GoRoute(
        path: '/supervisor',
        builder: (context, state) => SupervisorDashboard(),  // Phase 2+
        redirect: (context, state) => _checkRole(ref, UserRole.supervisor),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => AdminDashboard(),  // Phase 2+
        redirect: (context, state) => _checkRole(ref, UserRole.admin),
      ),
    ],
  );
});
```

### Core Widget Components

Phase 1 implements reusable styled components that later screens will use.

#### AppButton

Primary and secondary buttons matching design system specifications.

```dart
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final bool isLoading;
  
  // Styling:
  // - Primary: #FF4655 background, white text
  // - Secondary: white background, #0F1923 border and text
  // - Border radius: 0px
  // - Height: 48px
  // - Font: 13px, 600 weight, 0.12em letter-spacing, uppercase
  // - Disabled state: 0.5 opacity
}
```


#### AppTextField

Text input fields with validation support.

```dart
class AppTextField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType keyboardType;
  
  // Styling:
  // - Height: 48px
  // - Border: 1px solid #D1D5DB
  // - Border radius: 0px
  // - Focus border: 1px solid #FF4655
  // - Label: 12px, 700 weight, #6B7280, uppercase, 0.2em letter-spacing
  // - Input text: 16px, 400 weight, #0F1923
}
```

#### StatusBadge

Badge component for displaying ticket status, priority, category.

```dart
class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  
  // Styling:
  // - Border radius: 0px
  // - Padding: 4px 8px
  // - Font: 12px, 600 weight, uppercase
  // - Border: 1px solid matching background
}
```

#### MetricCard

Dashboard card for displaying numeric metrics.

```dart
class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData? icon;
  final VoidCallback? onTap;
  
  // Styling:
  // - Background: white
  // - Border: 1px solid #E5E7EB
  // - Border radius: 0px
  // - Padding: 16px
  // - Label: 12px, 700 weight, #6B7280, uppercase, 0.2em letter-spacing
  // - Value: 32px, 800 weight, #0F1923
  // - Icon: 24px, #FF4655
}
```

#### SectionHeader

Header component for labeled sections.

```dart
class SectionHeader extends StatelessWidget {
  final String label;
  
  // Styling:
  // - Font: 12px, 700 weight, #FF4655, uppercase, 0.2em letter-spacing
  // - Bottom border: 2px solid #FF4655
  // - Padding bottom: 8px
  // - Margin bottom: 16px
}
```

## Data Models

All data models use freezed for immutability, equality, copyWith, and JSON serialization. Models match backend entity structure exactly.

### User Model

```dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    required UserRole role,
    required Department department,
    required bool isActive,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

### Ticket Model

```dart
@freezed
class Ticket with _$Ticket {
  const factory Ticket({
    required String id,
    required String title,
    required String description,
    required TicketCategory category,
    required TicketSubtype subType,
    required TicketPriority priority,
    required TicketStatus status,
    required String employeeId,
    String? agentId,
    DateTime? lastActivityAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Ticket;
  
  factory Ticket.fromJson(Map<String, dynamic> json) => _$TicketFromJson(json);
}
```


### Notification Model

```dart
@freezed
class Notification with _$Notification {
  const factory Notification({
    required String id,
    required String userId,
    required NotificationType type,
    required String title,
    required String body,
    required bool isRead,
    required DateTime createdAt,
  }) = _Notification;
  
  factory Notification.fromJson(Map<String, dynamic> json) => _$NotificationFromJson(json);
}
```

### ActivityLog Model

```dart
@freezed
class ActivityLog with _$ActivityLog {
  const factory ActivityLog({
    required String id,
    required String userId,
    required String action,
    required String entityType,
    required String entityId,
    required Map<String, dynamic> metadata,
    required DateTime createdAt,
  }) = _ActivityLog;
  
  factory ActivityLog.fromJson(Map<String, dynamic> json) => _$ActivityLogFromJson(json);
}
```

### Response Wrapper Models

```dart
@freezed
class ApiResponse<T> with _$ApiResponse<T> {
  const factory ApiResponse({
    required T data,
  }) = _ApiResponse<T>;
  
  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) =>
      _$ApiResponseFromJson(json, fromJsonT);
}

@freezed
class PaginatedResponse<T> with _$PaginatedResponse<T> {
  const factory PaginatedResponse({
    required List<T> data,
    required PaginationMeta meta,
  }) = _PaginatedResponse<T>;
  
  factory PaginatedResponse.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) =>
      _$PaginatedResponseFromJson(json, fromJsonT);
}

@freezed
class PaginationMeta with _$PaginationMeta {
  const factory PaginationMeta({
    required int total,
    required int page,
    required int pageSize,
  }) = _PaginationMeta;
  
  factory PaginationMeta.fromJson(Map<String, dynamic> json) => _$PaginationMetaFromJson(json);
}
```

### Enum Definitions

```dart
enum UserRole {
  @JsonValue('employee')
  employee,
  @JsonValue('agent')
  agent,
  @JsonValue('supervisor')
  supervisor,
  @JsonValue('admin')
  admin,
}

enum Department {
  @JsonValue('IT')
  it,
  @JsonValue('HR')
  hr,
  @JsonValue('General')
  general,
}

enum TicketCategory {
  @JsonValue('IT')
  it,
  @JsonValue('HR')
  hr,
  @JsonValue('General')
  general,
}

enum TicketSubtype {
  @JsonValue('information')
  information,
  @JsonValue('action')
  action,
  @JsonValue('conversation')
  conversation,
  @JsonValue('escalation')
  escalation,
}

enum TicketPriority {
  @JsonValue('low')
  low,
  @JsonValue('medium')
  medium,
  @JsonValue('high')
  high,
}

enum TicketStatus {
  @JsonValue('open')
  open,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('escalated')
  escalated,
  @JsonValue('resolved')
  resolved,
  @JsonValue('closed')
  closed,
}

enum NotificationType {
  @JsonValue('ticket_update')
  ticketUpdate,
  @JsonValue('assignment')
  assignment,
  @JsonValue('escalation')
  escalation,
  @JsonValue('announcement')
  announcement,
}
```


## Design System Implementation

The design system translates FRONTEND_UI_AGENT_GUIDE specifications into Material 3 theme customization.

### Color Scheme

```dart
class AppColors {
  // Primary Brand Red
  static const primaryRed = Color(0xFFFF4655);
  
  // Dark Navy
  static const navy = Color(0xFF0F1923);
  
  // Backgrounds
  static const white = Color(0xFFFFFFFF);
  static const secondaryBackground = Color(0xFFF7F7F7);
  
  // Borders
  static const border = Color(0xFFE5E7EB);
  
  // Text
  static const mutedText = Color(0xFF6B7280);
  
  // Status Colors
  static const successGreen = Color(0xFF10B981);
  static const warningYellow = Color(0xFFF59E0B);
  static const errorRed = Color(0xFFEF4444);
}
```

### Typography

```dart
class AppTypography {
  static const _baseFont = 'Inter';
  
  // Hero Headlines (Bebas Neue alternative using Inter Tight)
  static const heroHeadline = TextStyle(
    fontFamily: _baseFont,
    fontSize: 48,
    fontWeight: FontWeight.w800,
    letterSpacing: -1.92,  // -0.04em
    height: 0.95,
  );
  
  // Section Headlines
  static const sectionHeadline = TextStyle(
    fontFamily: _baseFont,
    fontSize: 36,
    fontWeight: FontWeight.w700,
    height: 1.0,
  );
  
  // Navigation Labels
  static const navigationLabel = TextStyle(
    fontFamily: _baseFont,
    fontSize: 13,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.56,  // 0.12em
  );
  
  // Section Labels
  static const sectionLabel = TextStyle(
    fontFamily: _baseFont,
    fontSize: 12,
    fontWeight: FontWeight.w700,
    letterSpacing: 2.4,  // 0.2em
  );
  
  // Body Text
  static const body = TextStyle(
    fontFamily: _baseFont,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.7,
  );
  
  // Badge Text
  static const badge = TextStyle(
    fontFamily: _baseFont,
    fontSize: 12,
    fontWeight: FontWeight.w600,
  );
  
  // Metric Value
  static const metricValue = TextStyle(
    fontFamily: _baseFont,
    fontSize: 32,
    fontWeight: FontWeight.w800,
  );
}
```

### Spacing Tokens

```dart
class AppSpacing {
  // Component spacing
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
  
  // Section padding
  static const sectionPadding = 120.0;  // Desktop/tablet
  static const sectionPaddingMobile = 24.0;
  
  // Card padding
  static const cardPadding = 16.0;
  
  // List item spacing
  static const listItemSpacing = 12.0;
}
```

### Material 3 Theme Configuration

```dart
ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: AppColors.primaryRed,
      onPrimary: AppColors.white,
      secondary: AppColors.navy,
      onSecondary: AppColors.white,
      surface: AppColors.white,
      onSurface: AppColors.navy,
      background: AppColors.white,
      onBackground: AppColors.navy,
      error: AppColors.errorRed,
      onError: AppColors.white,
    ),
    
    // Typography
    textTheme: TextTheme(
      displayLarge: AppTypography.heroHeadline,
      displayMedium: AppTypography.sectionHeadline,
      labelLarge: AppTypography.navigationLabel,
      labelMedium: AppTypography.sectionLabel,
      bodyLarge: AppTypography.body,
      bodyMedium: AppTypography.badge,
    ),
    
    // Elevated Button (Primary)
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryRed,
        foregroundColor: AppColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(0),  // Sharp edges
        ),
        minimumSize: const Size(0, 48),
        textStyle: AppTypography.navigationLabel,
      ),
    ),
    
    // Outlined Button (Secondary)
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.navy,
        side: const BorderSide(color: AppColors.navy, width: 1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(0),  // Sharp edges
        ),
        minimumSize: const Size(0, 48),
        textStyle: AppTypography.navigationLabel,
      ),
    ),
    
    // Text Fields
    inputDecorationTheme: InputDecorationTheme(
      filled: false,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(0),  // Sharp edges
        borderSide: const BorderSide(color: AppColors.border, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(0),
        borderSide: const BorderSide(color: AppColors.border, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(0),
        borderSide: const BorderSide(color: AppColors.primaryRed, width: 1),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(0),
        borderSide: const BorderSide(color: AppColors.errorRed, width: 1),
      ),
      labelStyle: AppTypography.sectionLabel.copyWith(color: AppColors.mutedText),
      hintStyle: AppTypography.body.copyWith(color: AppColors.mutedText),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),
    
    // Cards
    cardTheme: CardTheme(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(0),  // Sharp edges
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      color: AppColors.white,
    ),
    
    // App Bar
    appBarTheme: AppBarTheme(
      elevation: 0,
      backgroundColor: AppColors.white,
      foregroundColor: AppColors.navy,
      centerTitle: false,
      titleTextStyle: AppTypography.navigationLabel.copyWith(
        color: AppColors.navy,
        fontSize: 16,
      ),
    ),
  );
}
```

