# DeskLine Flutter UI Implementation Plan

## Mandatory Project Rules

### Workspace Protection

- Do not modify the `web/` folder.
- Flutter implementation must live in a dedicated mobile application workspace.
- Any requested change affecting backend contracts, API shapes, authentication flow, database entities, permissions, status lifecycles, or response formats must be reported before implementation.
- Backend is considered finalized and the source of truth.
- Any backend modification required by a coding agent must be documented as a breaking-change proposal and explicitly approved.

---

## Objective

Build a Flutter application for Android and iOS covering all DeskLine Step 1 functionality while keeping the architecture ready for future backend integration and Step 2 communication features.

The mobile application must support:

- Employee
- Agent
- Supervisor
- Admin

from a single codebase.

---

## Design System Requirements

Follow FRONTEND_UI_AGENT_GUIDE exactly.

### Visual Style

- Enterprise SaaS
- Valorant-inspired structure
- Tactical and operational feel
- Sharp geometry
- Border-driven layouts
- Minimal use of red
- No gaming visuals
- No glassmorphism
- No rounded pills

### Core Colors

- Primary Red: #FF4655
- Navy: #0F1923
- White: #FFFFFF
- Secondary Background: #F7F7F7
- Border: #E5E7EB
- Muted Text: #6B7280

### Component Rules

- Border radius: 0–2px
- Strong dividers
- Grid-based layouts
- Table-like information presentation
- Uppercase labels
- Compact badges

---

## Flutter Technology Stack

### Core

- Flutter 3.x
- Dart
- Material 3 customized theme

### State Management

- Riverpod

### Routing

- GoRouter

### Networking Layer

- Dio

### Local Storage

- flutter_secure_storage

### Forms

- flutter_form_builder
- form_builder_validators

### Models

- freezed
- json_serializable

---

## Architecture

```text
lib/
 ├── app/
 ├── core/
 │    ├── theme/
 │    ├── constants/
 │    ├── networking/
 │    ├── errors/
 │    └── widgets/
 ├── features/
 │    ├── auth/
 │    ├── dashboard/
 │    ├── tickets/
 │    ├── notifications/
 │    ├── profile/
 │    ├── agent/
 │    ├── supervisor/
 │    └── admin/
 ├── shared/
 │    ├── models/
 │    ├── enums/
 │    └── services/
 └── main.dart
```

---

## Backend Integration Ready Strategy

All screens must consume repository interfaces instead of direct API calls.

Example:

- AuthRepository
- TicketRepository
- NotificationRepository
- UserRepository
- AdminRepository

Phase 1:

- Mock repositories
- Mock JSON responses
- Fake pagination

Phase 2:

- Swap repository implementations to Dio services
- No UI changes required

---

## Shared Components

Create reusable UI primitives.

### Layout

- AppShell
- RoleAwareScaffold
- SectionHeader
- MetricCard
- DataTableCard
- EmptyState

### Ticket Components

- TicketCard
- TicketStatusBadge
- TicketPriorityBadge
- TicketTimeline
- AssignmentCard
- ActivityTimeline

### Admin Components

- UserTable
- ActivityLogTable
- NotificationLogTable
- AnalyticsCards

---

# Authentication Module

## Screens

### Login

- Email
- Password
- Loading state
- Error state

### Register

- Name
- Email
- Password
- Department

Role not selectable.

---

# Employee Experience

## Employee Dashboard

Widgets:

- Active Tickets
- Recent Tickets
- Notifications
- Raise Ticket CTA

## Raise Ticket

Fields:

- Title
- Description
- Category
- Sub-Type
- Priority

## Ticket List

- Open
- In Progress
- Resolved
- Closed

## Ticket Detail

Sections:

- Metadata
- Status Timeline
- Assigned Agent
- Activity History

### Information Ticket

- AI Response Panel

### Conversation Ticket

- Future Chat Placeholder

### Escalation Ticket

- High Visibility Warning Layout

## Notification Centre

- Date Grouping
- Read State
- Filters

## Profile

- User Information
- Department
- Role

---

## Agent Experience

### Agent Dashboard

- Assigned Tickets
- Resolution Metrics
- New Assignments

### Agent Inbox

Filters:

- Status
- Category
- Sub-Type

### Ticket Detail

- Status Update Controls
- Escalate Action
- Activity History

---

## Supervisor Experience

### Supervisor Dashboard

- Open Tickets
- Escalated Tickets
- Team Metrics

### All Tickets View

- Global Search
- Filters
- Assignment Controls

### Escalation Queue

- Escalated Only
- Priority Indicators

### Agent Load View

Columns:

- Agent
- Department
- Open Tickets
- Resolved Tickets

---

## Admin Experience

### Admin Dashboard

- Total Tickets
- Active Tickets
- Resolved Tickets
- Escalated Tickets
- User Count

### User Management

- User Table
- Create User
- Edit User
- Deactivate User

### Activity Logs

- Search
- Filters
- Timeline View

### Notification Logs

- Notification History
- Filters

### Analytics

- Ticket Distribution
- Status Distribution
- Department Breakdown

### Future Navigation Placeholders

- Moderation Queue (Coming Soon)
- Webhook Event Logs (Coming Soon)

---

## Navigation Strategy

Authentication determines role.

After login:

- Employee → Employee shell
- Agent → Agent shell
- Supervisor → Supervisor shell
- Admin → Admin shell

Navigation generated from role permissions.

Unauthorized screens hidden.

---

## State Management Plan

Riverpod Providers:

- authProvider
- ticketProvider
- notificationProvider
- userProvider
- activityLogProvider
- analyticsProvider

Separate providers for:

- Loading
- Error
- Pagination
- Filters

---

## Responsive Requirements

Support:

- iPhone SE
- Modern iPhones
- Android phones
- Android tablets
- iPad

Use adaptive layouts.

Avoid web-style fixed widths.

---

## Step 2 Preparation

Reserve extension points only.

Do not implement:

- Chat UI
- CometChat
- Voice Calls
- Video Calls
- Moderation Queue Logic
- Webhook Event Logs Logic
just dont add in ui as well anything about step 2

---

## Delivery Phases

### Phase 1

- Theme system
- Design tokens
- Shared components
- Navigation

### Phase 2

- Authentication screens
- Employee screens

### Phase 3

- Agent screens
- Supervisor screens

### Phase 4

- Admin screens

### Phase 5

- Mock repositories
- Mock data integration

### Phase 6

- Accessibility
- Dark mode review (optional)
- Performance optimization

---

## Acceptance Criteria

- Supports all four roles.
- Follows Step 1 scope only.
- Fully matches documented backend contracts.
- Backend integration can be added by replacing repository implementations.
- No business logic embedded in UI widgets.
- Role-based navigation enforced.
- Future Step 2 modules have reserved extension points.
- No modifications to the existing web folder.
- Any backend contract change must be reported as a breaking change before implementation.