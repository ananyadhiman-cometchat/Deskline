# SCOPE OF WORK
## DeskLine — Internal Support Ticketing System

---

## Application Use Case

DeskLine is a lightweight internal support ticketing system built for small SaaS companies. Employees raise tickets for IT, HR, or general issues. Support agents resolve them. Supervisors handle escalations. Admins control users, system settings, and review flagged messages.

The platform ships as a **web app (React)** and a **mobile app (Flutter)**, both backed by a single Express.js API.

---

## Problem Statement

Small teams often struggle to manage support requests through emails and chats, leading to missed issues, delayed responses, and poor tracking.

DeskLine is a simple ticket management system that helps employees raise support requests, assigns them to the right person, tracks their progress, and ensures every issue is resolved. It also provides supervisors and administrators with visibility into ticket status, team workload, and overall support operations.



---

## Target Users

| Role            | Description                                                                          |
|-----------------|--------------------------------------------------------------------------------------|
| Employee        | Raises support tickets for IT, HR, or general issues.                                |
| Support Agent   | Claims and resolves tickets; chats with employees.                                   |
| Supervisor      | Oversees agent queues; handles escalations.                                          |
| Admin           | Manages users, roles, views platform-wide logs, reviews AI-flagged messages.         |

---

## User Roles

| Role       | Description                                                                   |
|------------|-------------------------------------------------------------------------------|
| Employee   | Create and track their own tickets; chat with assigned agent.                 |
| Agent      | Claim tickets from queue; update status; chat with employee; escalate.        |
| Supervisor | View all tickets; reassign between agents; join escalation chats.             |
| Admin      | Full access — user management, logs, dashboard, announcements, moderation.    |

---

## User Permissions

| Permission              | Employee   | Agent      | Supervisor | Admin      |
|-------------------------|------------|------------|------------|------------|
| Raise a ticket          | Yes        | No         | No         | No         |
| View own tickets        | Yes        | Yes        | Yes        | Yes        |
| View all tickets        | No         | Own queue  | Yes        | Yes        |
| Update ticket status    | No         | Yes        | Yes        | Yes        |
| Assign ticket           | No         | No         | Yes        | Yes        |
| Chat on ticket          | Yes        | Yes        | Yes        | Yes        |
| Escalate ticket         | No         | Yes        | Yes        | Yes        |
| Review flagged messages | No         | No         | No         | Yes        |
| Manage users            | No         | No         | No         | Yes        |
| View admin dashboard    | No         | No         | No         | Yes        |

---

## Ticket Sub-Types

Not all tickets are the same shape. DeskLine routes tickets by sub-type to determine whether they go to an AI agent or a human, and what kind of interaction is needed.

| Sub-Type        | Description                                                        | Routed To          | Chat Opens?        |
|-----------------|--------------------------------------------------------------------|--------------------|--------------------|
| Information     | Employee needs an answer — policy, process, how-to               | AI agent first     | No (AI handles it) |
| Action          | Something needs to be done — access granted, account created      | Human agent        | No (task-based)    |
| Conversation    | Something needs to be discussed — nuanced or unclear situation    | Human agent        | Yes (auto-opens)   |
| Escalation      | Urgent or sensitive — payroll error, data breach, legal concern   | Supervisor directly | Yes (auto-opens)  |

### AI Agent vs Human Agent Decision

```
Ticket submitted
      ↓
Sub-type = Information?
      ├── Yes → AI agent responds instantly
      │             ↓
      │      Employee satisfied?
      │             ├── Yes → Resolved
      │             │            ↓
      │             │  Employee confirmation
      │             │            ↓
      │             │         Closed
      │             └── No
      │                    ↓
      │        Request Human Help
      │                    ↓
      │        Assigned Human Agent
      │                    ↓
      │            In Progress
      │                    ↓
      │              Resolved
      │                    ↓
      │      Employee confirmation
      │                    ↓
      │                 Closed
      │
      └── No  → route to human agent by department + load
                        ↓
                  Agent available (online)?
                        ├── Yes → assign immediately
                        └── No  → queue; Supervisor notified
```

### Human Agent Assignment Logic

1. **Department match** — ticket category maps to an agent pool (IT / HR / General)
2. **Load balancing** — within the pool, assign to the agent with fewest open tickets
3. **Availability** — if no agent is online, ticket queues and Supervisor is notified

---

## Tech Stack

### Web Frontend

| Layer        | Technology                |
|--------------|---------------------------|
| Framework    | React 18 + TypeScript     |
| Routing      | React Router v6           |
| UI State     | Zustand                   |
| Server State | TanStack Query            |
| Styling      | Tailwind CSS + shadcn/ui  |
| Chat UI      | CometChat React UI Kit v5 |
| Forms        | React Hook Form + Zod     |
| Build        | Vite                      |

### Mobile Frontend

| Layer               | Technology                      |
|---------------------|---------------------------------|
| Framework           | Flutter 3.x (Dart)              |
| State Management    | Riverpod                        |
| Navigation          | GoRouter                        |
| Chat UI             | CometChat Flutter UI Kit        |
| Push Notifications  | firebase_messaging (FCM + APNs) |
| HTTP                | Dio                             |
| Local Storage       | flutter_secure_storage          |

### Backend

| Layer         | Technology                                |
|---------------|-------------------------------------------|
| Runtime       | Node.js 20 LTS                            |
| Framework     | Express.js                                |
| Auth          | JWT + Refresh Tokens                      |
| ORM           | Prisma                                    |
| Database      | PostgreSQL 16                             |
| CometChat SDK | @cometchat/chat-sdk-javascript (REST API) |
| Push          | FCM via Firebase Admin SDK                |
| Validation    | Zod                                       |

### CometChat Products

| Product                  | Purpose                                                              |
|--------------------------|----------------------------------------------------------------------|
| JavaScript Chat SDK      | Core messaging, groups, presence (web)                               |
| Flutter Chat SDK         | Core messaging, groups, presence (mobile)                            |
| React UI Kit v5          | Pre-built chat components (web)                                      |
| Flutter UI Kit           | Pre-built chat components (mobile)                                   |
| Webhooks                 | Sync chat events to backend — update ticket status, log activity     |
| AI Moderation            | Auto-flag inappropriate messages; surfaces in Admin dashboard        |
| Voice & Video Calling    | Escalation calls between employee and agent                          |
| Push Notifications       | Message and call alerts on web and mobile                            |

---

## User Workflows

### Employee Workflow
1. Register / Log in
2. Raise a ticket — select sub-type: Information, Action, Conversation, or Escalation
3. View ticket status and history
4. Chat with assigned agent on the ticket *(CometChat — Step 2, Conversation sub-type)*
5. Receive push notifications on status updates

### Agent Workflow
1. Log in and view ticket queue (Action and Conversation sub-types only)
2. Claim or receive an assigned ticket
3. Update ticket status: Open → In Progress → Resolved
4. Chat with employee *(CometChat — Step 2, auto-opens for Conversation tickets)*/1:1 chat
5. Escalate to Supervisor when needed
6. Receive push notifications for new assignments

### Supervisor Workflow
1. View all tickets and agent queues
2. Receive and handle Escalation sub-type tickets directly
3. Reassign tickets between agents
4. Join escalated ticket chats as a third participant *(CometChat — Step 2)* /Group chat
5. View agent performance metrics

### Admin Workflow
1. Manage all users — create, update, deactivate, assign roles
2. View system-wide ticket and activity logs
3. Review AI-flagged messages and take action *(Step 2)*
4. View webhook event logs *(Step 2)*
5. Send announcements to all users or a role group

---


### Public / Auth

| Screen   | Description                                          |
|----------|------------------------------------------------------|
| Login    | Email + password login for all roles                 |
| Register | Self-registration; role assigned by Admin post-signup |

### Employee (Web + Mobile)

| Screen             | Description                                              |
|--------------------|----------------------------------------------------------|
| My Dashboard       | Active tickets, raise new ticket button, notification bell |
| Raise Ticket       | Form: title, description, category, sub-type, priority   |
| Ticket Detail      | Status timeline, chat panel *(Step 2, Conversation only)* |
| Notification Centre | In-app notification history                             |
| Profile            | View and edit own profile                                |

### Agent (Web + Mobile)

| Screen        | Description                                                       |
|---------------|-------------------------------------------------------------------|
| Agent Inbox   | Queue of assigned tickets filtered by sub-type and status         |
| Ticket Detail | Full ticket info, status controls, chat panel *(Step 2)*          |
| Profile       | View and edit own profile                                         |

### Supervisor (Web)

| Screen           | Description                                            |
|------------------|--------------------------------------------------------|
| All Tickets View | Filterable list of all tickets across agents           |
| Escalation Queue | Escalation sub-type tickets assigned directly to Supervisor |
| Agent Load View  | Ticket count and resolution rate per agent             |

### Admin (Web)

| Screen            | Description                                                              |
|-------------------|--------------------------------------------------------------------------|
| Admin Dashboard   | User management, ticket analytics, notification log, webhook log         |
| User Management   | Create, edit, deactivate users, assign roles                             |
| Moderation Queue  | AI-flagged messages with dismiss/block actions *(Step 2)*                |
| Webhook Event Log | CometChat events received, status, payload preview *(Step 2)*            |

---

## Backend APIs

### Auth

| Method | Endpoint            | Description                                        |
|--------|---------------------|----------------------------------------------------|
| POST   | `/api/auth/register` | Register + *(Step 2)* create CometChat user       |
| POST   | `/api/auth/login`   | Login + *(Step 2)* return CometChat auth token    |
| POST   | `/api/auth/logout`  | Invalidate JWT                                     |
| GET    | `/api/auth/me`      | Current user profile                               |

### Tickets

| Method | Endpoint                    | Description                               |
|--------|-----------------------------|-------------------------------------------|
| POST   | `/api/tickets`              | Create ticket (sub-type drives routing)   |
| GET    | `/api/tickets`              | List tickets (filtered by role)           |
| GET    | `/api/tickets/:id`          | Ticket detail                             |
| PATCH  | `/api/tickets/:id`          | Update status or assignment               |
| POST   | `/api/tickets/:id/request-human-help` | Route information ticket to a human agent |
| POST   | `/api/tickets/:id/escalate` | Escalate ticket to Supervisor             |

### Ticket Module Plan

**Purpose:** handle ticket creation, assignment, state transitions, and escalation from one service layer so web and mobile both follow the same backend rules.

**API decisions**
- `POST /api/tickets` creates the ticket, validates the payload, then routes it immediately.
- `GET /api/tickets` returns role-scoped lists: employee owns, agent queue, supervisor all, admin all.
- `GET /api/tickets/:id` returns ticket detail plus the history needed for the timeline view.
- `PATCH /api/tickets/:id` updates status or assignment, but assignment changes are supervisor/admin only.
- `POST /api/tickets/:id/escalate` converts the ticket into the escalation path and notifies the supervisor.
- `POST /api/tickets/:id/request-human-help` allows an employee to move an Information ticket from AI handling into the human-agent workflow.

### Ticket Resolution Confirmation

- Resolved means a solution or answer has been provided.
- Closed means the employee accepted the resolution or the system automatically closed the ticket.

When a ticket enters `resolved`:
1. The employee receives a confirmation request.
2. The employee can confirm or reject the resolution.
3. If confirmed, the ticket moves to `closed`.
4. If rejected:
      - Information tickets may request human help.
      - Human-handled tickets return to active handling.
5. If the employee does not respond within 24 hours, the system automatically closes the ticket.

### Escalation Ownership Rule

Once a ticket is escalated:
- The original agent loses ownership.
- The assigned supervisor becomes the active owner.
- Future status updates are performed by the supervisor or admin.

**Decision plan**
- `information` → simulated AI reply, no agent assignment.
- `action` → human agent by category/department and lowest open-ticket load.
- `conversation` → same human-agent routing as action, but chat is expected to open later.
- `escalation` → supervisor directly, skipping the agent pool.
- If no agent matches, keep the ticket unassigned and notify the department supervisors.

**Service responsibilities**
- Enforce allowed status transitions in the service layer.
- Write `ActivityLog` records for ticket create, claim, assign, escalate, and resolve.
- Write `Notification` records for assignment, update, escalation, and AI reply events.
- Keep routing rules deterministic so the same input always produces the same assignment choice.

### Users & Admin

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/admin/users`                | List all users           |
| POST   | `/api/admin/users`                | Create user              |
| PATCH  | `/api/admin/users/:id`            | Update user              |
| PATCH  | `/api/admin/users/:id/deactivate` | Deactivate user          |
| GET    | `/api/admin/activity-logs`        | View activity logs       |
| GET    | `/api/admin/notification-logs`    | View notification logs   |

### Notifications

| Method | Endpoint                  | Description                     |
|--------|---------------------------|---------------------------------|
| POST   | `/api/notifications/send` | Trigger push notification       |
| GET    | `/api/notifications`      | Notification history for user   |

### CometChat — Step 2

| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/cometchat/auth-token`       | Generate CC auth token (server-side only) |
| POST   | `/webhooks/cometchat`             | Receive and process CometChat webhook events |
| GET    | `/api/admin/moderation`           | AI-flagged messages queue                |
| POST   | `/api/admin/moderation/:id/action` | Dismiss / block sender                  |

---
## Database Entities

### users
| Field          | Type      | Notes                          |
|----------------|-----------|--------------------------------|
| id             | UUID      | Primary key                    |
| name           | VARCHAR   |                                |
| email          | VARCHAR   | Unique                         |
| password_hash  | VARCHAR   |                                |
| role           | ENUM      | employee, agent, supervisor, admin |
| department     | VARCHAR   | IT, HR, General                |
| is_active      | BOOLEAN   | Default true                   |
| cometchat_uid  | VARCHAR   | Step 2 — matches app user id   |
| fcm_token      | VARCHAR   | For push notifications         |
| created_at     | TIMESTAMP |                                |

### tickets
| Field              | Type      | Notes                                              |
|--------------------|-----------|----------------------------------------------------|
| id                 | UUID      | Primary key                                        |
| title              | VARCHAR   |                                                    |
| description        | TEXT      |                                                    |
| category           | ENUM      | IT, HR, General                                    |
| sub_type           | ENUM      | information, action, conversation, escalation      |
| priority           | ENUM      | low, medium, high                                  |
| status             | ENUM      | open, in_progress, escalated, resolved, closed     |
| employee_id        | UUID      | FK → users                                         |
| agent_id           | UUID      | FK → users, nullable until assigned                |
| last_activity_at   | TIMESTAMP | Updated on every message; drives inactivity check  |
| cometchat_convo_id | VARCHAR   | Step 2 — links ticket to CometChat conversation    |
| created_at         | TIMESTAMP |                                                    |
| updated_at         | TIMESTAMP |                                                    |

### notifications
| Field      | Type      | Notes                                          |
|------------|-----------|------------------------------------------------|
| id         | UUID      | Primary key                                    |
| user_id    | UUID      | FK → users                                     |
| type       | ENUM      | ticket_update, assignment, escalation, announcement, cometchat |
| title      | VARCHAR   |                                                |
| body       | TEXT      |                                                |
| is_read    | BOOLEAN   | Default false                                  |
| created_at | TIMESTAMP |                                                |

### activity_logs
| Field       | Type      | Notes                                             |
|-------------|-----------|---------------------------------------------------|
| id          | UUID      | Primary key                                       |
| user_id     | UUID      | FK → users — who performed the action             |
| action      | VARCHAR   | e.g. ticket_created, status_updated, escalated    |
| entity_type | VARCHAR   | e.g. ticket, user                                 |
| entity_id   | UUID      | ID of the affected record                         |
| metadata    | JSONB     | Any extra context — old status, new status, etc.  |
| created_at  | TIMESTAMP |                                                   |

### webhook_event_logs *(Step 2)*
| Field        | Type      | Notes                                          |
|--------------|-----------|------------------------------------------------|
| id           | UUID      | Primary key                                    |
| event_type   | VARCHAR   | e.g. message.sent, conversation.ended          |
| payload      | JSONB     | Full raw webhook payload from CometChat        |
| status       | ENUM      | received, processed, failed                    |
| error_message| TEXT      | Populated if status is failed                  |
| processed_at | TIMESTAMP |                                                |
| created_at   | TIMESTAMP |                                                |

---

## Notification Flows

All notifications funnel through `createNotification()` in the backend, which:
1. Creates a record in the `notifications` database table
2. Logs an `activity_log` entry (`notification_sent`)
3. Fires an FCM push notification if the recipient has a stored `fcmToken`

### Notification Types (enum)

| Type            | Description                                             |
|-----------------|---------------------------------------------------------|
| `ticket_update` | Status changes, resolutions, AI replies, comments       |
| `assignment`    | Ticket assigned to agent/supervisor                     |
| `escalation`    | Ticket escalated to supervisor                          |
| `announcement`  | Admin broadcast messages                                |
| `cometchat`     | CometChat-originated events (Step 2)                    |

### App-Originated — Ticket Creation

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 1 | Information ticket → AI auto-reply           | Employee (ticket creator)         | `ticket_update` | AI replied to your ticket                    |
| 2 | Action/Conversation ticket → agent assigned  | Assigned Agent                    | `assignment`    | New ticket assigned: "[Title]"               |
| 3 | Escalation ticket → supervisor assigned      | Assigned Supervisor               | `escalation`    | Escalated ticket assigned: "[Title]"         |
| 4 | No assignee found for ticket                 | All Supervisors in department     | `assignment`    | Unassigned ticket in your department         |

### App-Originated — Ticket Status Changes

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 5 | Any status change                            | Employee (ticket owner)           | `ticket_update` | Your ticket is now [status]                  |
| 6 | Agent marks ticket as resolved               | Employee                          | `ticket_update` | Please confirm whether your issue is resolved|

### App-Originated — Ticket Escalation

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 7 | Agent/Supervisor escalates ticket            | Best-fit Supervisor               | `escalation`    | Ticket has been escalated to you             |
| 8 | Ticket escalated                             | Employee (ticket owner)           | `ticket_update` | Your ticket is now escalated                 |

### App-Originated — Ticket Assignment/Reassignment

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 9 | Supervisor/Admin assigns ticket              | New Assignee (Agent/Supervisor)   | `assignment`    | You have been assigned to "[Title]"          |

### App-Originated — Resolution Confirmation Flow

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 10| Employee confirms resolution                 | Employee                          | `ticket_update` | Ticket closed after your confirmation        |
| 11| Employee confirms resolution                 | Assigned Agent                    | `ticket_update` | Resolution accepted                          |
| 12| Employee rejects resolution                  | Assigned Agent                    | `ticket_update` | Ticket reopened — resolution rejected        |

### App-Originated — Human Help Request

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 13| Employee requests human help (AI ticket)     | Assigned Agent                    | `assignment`    | Employee requested human assistance          |

### App-Originated — Auto-Close Job (cron, every hour)

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 14| 24h timeout without employee response        | Employee                          | `ticket_update` | Ticket automatically closed after 24 hours   |

### App-Originated — Comments

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 15| Employee posts a comment                     | Assigned Agent                    | `ticket_update` | New reply on "[Title]"                       |
| 16| Agent/Supervisor/Admin posts a comment       | Employee (ticket owner)           | `ticket_update` | New reply on your ticket                     |

### App-Originated — Admin Announcements

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 17| Admin sends announcement                     | All users (or filtered by role)   | `announcement`  | Custom title/body                            |

### App-Originated — Manual Send (API)

| # | Trigger                                      | Recipient                         | Type            | Message                                      |
|---|----------------------------------------------|-----------------------------------|-----------------|----------------------------------------------|
| 18| POST /notifications/send by authenticated user | Specified user                  | Any type        | Custom title/body                            |

### Role-Based Summary

| Role           | Receives notifications for                                                                  |
|----------------|---------------------------------------------------------------------------------------------|
| Employee       | Status changes, resolution requests, AI replies, auto-close, agent comments, announcements  |
| Agent          | New assignments, employee comments, resolution accept/reject, announcements                 |
| Supervisor     | Escalations, unassigned tickets in their department, announcements                          |
| Admin          | Announcements (if targeted)                                                                 |

### CometChat-Originated — Step 2

| Trigger                    | Recipient      | Channel                              |
|----------------------------|----------------|--------------------------------------|
| New chat message (offline) | Recipient user | CometChat Push (FCM/APNs)            |
| Missed call                | Callee         | CometChat Push + in-app banner       |
| Message auto-flagged       | Admin          | In-app notification                  |

> Existing app notifications must continue working after CometChat integration is added.

---

## Admin Dashboard Scope

- User management — create, edit, deactivate, assign roles
- Ticket overview — total, open, in-progress, resolved, escalated; broken down by sub-type
- Agent performance — tickets handled, average resolution time
- Notification log — all notifications sent, timestamp, recipient, status
- Activity log — all user actions with timestamps
- Moderation queue — AI-flagged messages with dismiss/block actions *(Step 2)*
- Webhook event log — CometChat events received, processed status *(Step 2)*

---

## CometChat Integration Plan — Step 2 Overview

| CometChat Feature       | How It Is Used                                                                                           |
|-------------------------|----------------------------------------------------------------------------------------------------------|
| User Sync               | All users synced to CometChat on registration; bulk sync for 100+ seeded users.                          |
| 1:1 Chat                | Employee ↔ Agent chat auto-opens when an agent claims a Conversation sub-type ticket.                    |
| Group Chat (Escalation) | When escalated, Supervisor is added to the existing 1:1, forming a 3-way group.                          |
| Tags & RBAC             | Users tagged by role and department; employees restricted from messaging each other.                     |
| Push Notifications      | CometChat message/call alerts coexist with existing app push notifications.                              |
| AI Moderation           | Profanity filter + image moderation runs automatically; flagged messages surface in Admin dashboard only. |
| Webhooks                | `message.sent` → log activity; `conversation.ended` → mark ticket resolved; `message.flagged` → notify Admin. |
| Agent Chat Flow         | Agent inbox shows all active CometChat conversations with availability status.                           |
| Voice & Video Calling   | Employee can request a call from the ticket page; agent accepts from their inbox.                        |
| AI Agent                |  Using ai agent for simple informational query tickets                                                   |

---

## Assumptions

- Web app is primary; mobile shares the same backend APIs.
- Email verification is out of scope; email is stored but not verified.
- CometChat App ID, Region, and Auth Key are stored as server environment variables only — never sent to the client.
- Every user's CometChat UID matches their app user ID.
- Push notifications use FCM for both web and mobile.
- 100+ users seeded via a seed script with realistic dummy data across all roles.
- File attachments in tickets are out of scope for Step 1.
- AI agent for Information sub-type tickets is simulated in Step 1 (auto-reply message); real CometChat AgentKit integration is Step 2.
- Chat auto-opens only for Conversation and Escalation sub-types; Action and Information tickets do not require a chat window.

---

## Out-of-Scope Items

- SLA timers and breach alerts
- Payment or billing integration
- Multi-language / i18n support
- Third-party CRM integrations
- Advanced analytics or custom reporting
- Desktop app
- Human moderator role (replaced entirely by CometChat AI Moderation in Step 2)

---

## Acceptance Criteria

### Step 1 — Core App
- [ ] User registration, login, and logout work for all roles
- [ ] Role-based access control enforced on all routes
- [ ] Employees can raise tickets with a sub-type selection
- [ ] Information tickets receive a simulated auto-reply; others route to human agents
- [ ] Agents can view queue, claim, update, and escalate tickets
- [ ] Supervisors receive Escalation sub-type tickets directly and can reassign others
- [ ] Admin can manage users, view logs, and use the dashboard
- [ ] Push notifications fire for all defined trigger events
- [ ] 100+ users seeded with varied roles and activity history
- [ ] SCOPE_OF_WORK.md approved before implementation begins

### Step 2 — CometChat Integration
- [ ] SDK initialises on app load without errors
- [ ] Auth token generated server-side; never exposed to the client
- [ ] All existing app notifications continue working after integration
- [ ] 1:1 chat auto-opens for Conversation sub-type tickets when agent claims them
- [ ] Escalation group chat works — Supervisor added to conversation
- [ ] CometChat push notifications delivered on web and mobile
- [ ] Tags applied to all users by role and department
- [ ] AI Moderation auto-flags profanity and images; appears in Admin dashboard
- [ ] Flagged messages appear in Admin moderation queue within 10 seconds
- [ ] At least 4 webhook events processed and visible in admin log
- [ ] Agent inbox shows active conversations with availability status
- [ ] New users auto-synced to CometChat on registration

---

## Testing Plan

### Unit Tests
- CometChat auth token generation
- Webhook event handler functions per event type
- Role-based route guard middleware
- Ticket routing logic — correct sub-type maps to correct agent pool or AI

### Integration Tests
- Register → CometChat user created → login → CC auth token returned *(Step 2)*
- Ticket created with Conversation sub-type → agent notified → chat auto-opens *(Step 2)*
- Ticket created with Information sub-type → AI auto-reply fires
- Webhook receiver processes `message.sent` → updates activity log *(Step 2)*
- Webhook receiver processes `message.flagged` → appears in Admin moderation queue *(Step 2)*

### E2E Tests
- Employee raises Conversation ticket → agent claims it → chat opens in real time *(Step 2)*
- Employee raises Information ticket → receives AI auto-reply → marks resolved
- Agent escalates → Supervisor added to group chat *(Step 2)*
- Admin views webhook event log after a chat event fires *(Step 2)*
- Admin reviews and dismisses an AI-flagged message *(Step 2)*

### Manual QA
- Web: Chrome, Firefox, Safari — 375px / 768px / 1440px
- Mobile: iOS simulator + physical Android device
- Push notifications tested on physical devices

---

## Demo Plan

### Phase 1 — Core App (Step 1)
1. Admin logs in → views seeded users → verifies roles and counts
2. Employee raises an **Information** ticket → AI auto-reply fires instantly
3. Employee raises a **Conversation** ticket → push notification fires to agent
4. Agent claims ticket → status updates to In Progress → employee notified
5. Agent escalates → Supervisor receives Escalation ticket directly
6. Supervisor reassigns an Action ticket to a different agent

### Phase 2 — CometChat Communication (Step 2)
7. Agent claims Conversation ticket → 1:1 CometChat chat auto-opens on ticket page
8. Employee and agent chat in real time (two browser windows side by side)
9. Agent escalates → Supervisor added → group chat of three participants
10. Employee sends a banned word → AI Moderation blocks delivery → message flagged
11. Admin logs in → reviews flagged message in moderation queue → dismisses it

### Phase 3 — Webhooks & Admin (Step 2)
12. Ticket chat ends → `conversation.ended` webhook fires → ticket auto-marked Resolved
13. Admin opens webhook event log → live events from demo are visible
14. Admin views moderation log → sees flagged message record with action taken

> **Estimated demo time:** 20–25 minutes
>
> **Seed data:** 5 admins, 10 supervisors, 20 agents, 65+ employees, 50+ tickets spread across all four sub-types, categories, and statuses.

---

*Replace all [bracketed] placeholders before submitting for approval.*