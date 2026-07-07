# API Documentation — DeskLine

> REST API reference for the DeskLine backend (Express 5 + Prisma + PostgreSQL). Base path: **`/api`**. Server entry: `backend/src/server.ts`; app factory: `backend/src/app.ts`. Default port: `4000` (`PORT`).

---

## Conventions

### Base URL
- Local: `http://localhost:4000/api`
- Same-origin in production (`/api/*`, proxied by nginx to the backend)

### Authentication
JWT bearer authentication with an **access + refresh** token pattern.

- **Access token** — short-lived (default `15m`), signed with `JWT_ACCESS_SECRET`. Sent on every authenticated request:
  ```
  Authorization: Bearer <accessToken>
  ```
- **Refresh token** — long-lived (default `7d`), a random 48-byte value stored **hashed** in the `refresh_tokens` table. Exchanged at `/api/auth/refresh`; rotated (old token revoked) on each use.

Auth is enforced by `authenticateRequest` (`backend/src/middleware/auth.ts`), which verifies the access token, loads the user, attaches `req.user`, and rejects inactive accounts.

### Authorization (RBAC)
Two guard middlewares layer on top of `authenticateRequest`:

- `requireRole(...roles)` — allows only the listed `UserRole` values.
- `requirePermission(permission)` — checks the role→permission map in `backend/src/config/rbac.ts`.

Permission map:

| Role | Permissions |
|---|---|
| `employee` | `auth:self`, `auth:session` |
| `agent` | `auth:self`, `auth:session` |
| `supervisor` | `auth:self`, `auth:session` |
| `admin` | `users:manage`, `logs:view`, `dashboard:view`, `announcements:send`, `auth:self`, `auth:session` |

Beyond route-level guards, **data scoping** happens in the service layer (e.g. an employee's ticket list returns only their own tickets; an agent's returns their queue).

### Standard response envelope

Success:
```json
{ "data": { }, "meta": { } }
```
`meta` is present on list endpoints (pagination) and aggregate endpoints.

Pagination `meta`:
```json
{ "total": 120, "page": 1, "pageSize": 20, "totalPages": 6 }
```

Error:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```
Handled globally by `backend/src/middleware/error-handler.ts`. `AppError` carries an explicit status + code; anything else becomes `500`.

### Input validation
Request bodies and query strings are validated with **Zod** schemas per module. A validation failure returns `400 INVALID_REQUEST`.

### Cross-cutting middleware
Helmet (security headers) → CORS (origins from `CORS_ORIGINS`, fallback to localhost) → `express.json()` → Pino request logger (redacts the `Authorization` header) → routes → global error handler.

> **Rate limiting is not implemented** in Step 1. Noted as a hardening item.

---

## Endpoint index

| # | Method | Path | Auth |
|---|---|---|---|
| 1 | GET | `/api` | public |
| 2 | GET | `/api/health` | public |
| 3 | POST | `/api/auth/register` | public |
| 4 | POST | `/api/auth/login` | public |
| 5 | POST | `/api/auth/logout` | public (refresh token) |
| 6 | POST | `/api/auth/refresh` | public (refresh token) |
| 7 | GET | `/api/auth/me` | authenticated |
| 8 | POST | `/api/tickets` | authenticated |
| 9 | GET | `/api/tickets` | authenticated (role-scoped) |
| 10 | GET | `/api/tickets/:id` | authenticated |
| 11 | PATCH | `/api/tickets/:id` | agent / supervisor / admin |
| 12 | POST | `/api/tickets/:id/request-human-help` | authenticated |
| 13 | POST | `/api/tickets/:id/escalate` | agent / supervisor / admin |
| 14 | POST | `/api/tickets/:id/confirm-resolution` | authenticated |
| 15 | POST | `/api/tickets/:id/reject-resolution` | authenticated |
| 16 | GET | `/api/tickets/:id/comments` | authenticated |
| 17 | POST | `/api/tickets/:id/comments` | authenticated |
| 18 | GET | `/api/notifications` | authenticated |
| 19 | POST | `/api/notifications/send` | authenticated |
| 20 | GET | `/api/users/profile` | authenticated |
| 21 | PATCH | `/api/users/profile` | authenticated |
| 22 | PATCH | `/api/users/me/fcm-token` | authenticated |
| 23 | GET | `/api/admin/users` | `users:manage` |
| 24 | POST | `/api/admin/users` | `users:manage` |
| 25 | PATCH | `/api/admin/users/:id` | `users:manage` |
| 26 | PATCH | `/api/admin/users/:id/deactivate` | `users:manage` |
| 27 | GET | `/api/admin/activity-logs` | `logs:view` |
| 28 | GET | `/api/admin/notification-logs` | `logs:view` |
| 29 | GET | `/api/admin/dashboard` | `dashboard:view` |
| 30 | GET | `/api/admin/agent-load` | supervisor / admin |
| 31 | POST | `/api/admin/announcements` | `announcements:send` |
| 32 | GET | `/api/admin/supervisor/escalations` | supervisor / admin |
| 33 | GET | `/api/admin/supervisor/dashboard` | supervisor / admin |
| 34 | GET | `/api/admin/agent/metrics` | agent / admin |

---

## Meta

### GET `/api`
API metadata. Public.
```json
{ "name": "DeskLine API", "version": "v1", "status": "ok" }
```

### GET `/api/health`
Health check (used by the load balancer). Public.
```json
{ "status": "ok", "service": "DeskLine API" }
```

---

## Auth

### POST `/api/auth/register`
Public self-registration. Creates an **employee** account and returns tokens.

Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "min 8 chars",
  "department": "IT | HR | General"
}
```
`201` →
```json
{ "user": { "id": "…", "name": "…", "email": "…", "role": "employee", "department": "IT", "isActive": true },
  "accessToken": "…", "refreshToken": "…" }
```
Role is assigned by an admin afterwards.

### POST `/api/auth/login`
Body: `{ "email": string, "password": string }`. Updates `lastLoginAt`, issues a new refresh session. Returns `{ user, accessToken, refreshToken }`.

### POST `/api/auth/refresh`
Body: `{ "refreshToken": string }`. Validates and **rotates** the refresh token (revokes the old one), returns a fresh `{ user, accessToken, refreshToken }`.

### POST `/api/auth/logout`
Revokes the supplied refresh token (from body `refreshToken` or the `x-refresh-token` header) and logs the logout. Returns `{ "success": true }`.

### GET `/api/auth/me`
Authenticated. Returns the current user profile: `{ "data": { …SafeUser } }`.

---

## Tickets

All ticket routes require `authenticateRequest`. Role and ownership scoping is applied in `tickets.service.ts`.

### POST `/api/tickets`
Create a ticket. Sub-type drives routing (see [SCOPE_OF_WORK.md](SCOPE_OF_WORK.md#ticket-sub-types)).

Body:
```json
{
  "title": "5–200 chars",
  "description": "10–2000 chars",
  "category": "IT | HR | General",
  "subType": "information | action | conversation | escalation",
  "priority": "low | medium | high"
}
```
`201` → `{ "data": { …Ticket } }`

Routing on create:
- `information` → AI auto-reply posted as a comment (`isAi: true`), employee notified; no human assigned.
- `action` / `conversation` → assigned to the least-loaded active agent in the matching department; agent notified.
- `escalation` → assigned directly to a department supervisor.
- No match → left unassigned; department supervisors notified.

### GET `/api/tickets`
Role-scoped, paginated list. Query:
```
page (default 1), pageSize (1–100, default 20),
status?, subType?, category?
```
→ `{ "data": [ …Ticket ], "meta": { total, page, pageSize, totalPages } }`

Scoping: employee → own tickets; agent → their queue; supervisor/admin → all.

### GET `/api/tickets/:id`
Single ticket with detail. Access checked in service. → `{ "data": { …Ticket } }`

### PATCH `/api/tickets/:id`
Update status and/or assignment. **agent / supervisor / admin.** Assignment changes are supervisor/admin only (enforced in service). Body:
```json
{ "status": "open | in_progress | escalated | resolved | closed", "agentId": "uuid (optional)" }
```
Marking `resolved` triggers a resolution-confirmation request to the employee.

### POST `/api/tickets/:id/request-human-help`
Moves an `information` (AI-handled) ticket into the human-agent workflow; assigns an agent and notifies them. → `{ "data": { …Ticket } }`

### POST `/api/tickets/:id/escalate`
Escalate to a supervisor. **agent / supervisor / admin.** Transfers ownership to the supervisor, notifies both supervisor and employee. → `{ "data": { …Ticket } }`

### POST `/api/tickets/:id/confirm-resolution`
Employee accepts the resolution → ticket moves to `closed`. Notifies employee and agent.

### POST `/api/tickets/:id/reject-resolution`
Employee rejects the resolution → ticket returns to active handling. Notifies the agent.

### GET `/api/tickets/:id/comments`
List comments (including AI replies) on a ticket. → `{ "data": [ …Comment ] }`

### POST `/api/tickets/:id/comments`
Add a comment. Body: `{ "body": "1–2000 chars" }`. Notifies the counterparty (employee ↔ assignee). `201` → `{ "data": { …Comment } }`

---

## Notifications

### GET `/api/notifications`
The current user's notifications (and marks them read). → `{ "data": [ …Notification ], "meta": { total, page, pageSize } }`

### POST `/api/notifications/send`
Manually send a notification to a user. Body:
```json
{ "userId": "uuid", "type": "ticket_update | assignment | escalation | announcement | cometchat",
  "title": "…", "body": "…" }
```
Persists a notification row, logs the activity, and fires an FCM push if the recipient has an `fcmToken`. See [NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md).

---

## Users & profile

### GET `/api/users/profile`
Current user's full profile. → `{ "data": { …UserProfile } }`

### PATCH `/api/users/profile`
Update the current user's profile (e.g. name). → `{ "data": { …UserProfile } }`

### PATCH `/api/users/me/fcm-token`
Register/update the device FCM token used for push. Body: `{ "fcmToken": string }`.

---

## Admin — user management

All require `authenticateRequest` + `requirePermission('users:manage')` (admin).

### GET `/api/admin/users`
Paginated user list. Query: `page (default 1), limit (1–100, default 20), role?, department?, isActive?`. → `{ "data": [ …User ], "meta": { total, page, limit, totalPages } }`

### POST `/api/admin/users`
Create a user of any role. Body:
```json
{ "name": "…", "email": "…", "password": "min 8",
  "role": "employee | agent | supervisor | admin",
  "department": "IT | HR | General", "isActive": true }
```
`201` → `{ "data": { …User } }`

### PATCH `/api/admin/users/:id`
Update a user (partial; password optional). → `{ "data": { …User } }`

### PATCH `/api/admin/users/:id/deactivate`
Set the account inactive (soft deactivate). → `{ "data": { …User } }`

---

## Admin — logs, dashboards & announcements

### GET `/api/admin/activity-logs` — `logs:view`
Filterable activity feed. Query: `page, pageSize, userId?, action?, entityType?, from?, to?` (dates ISO).

### GET `/api/admin/notification-logs` — `logs:view`
All notifications sent. Query: `page, pageSize, type?, isRead?, from?, to?`.

### GET `/api/admin/dashboard` — `dashboard:view`
Aggregate platform metrics:
```json
{ "data": {
  "totals": { "users": 0, "tickets": 0, "notifications": 0, "unreadNotifications": 0, "resolvedToday": 0 },
  "usersByRole": [ { "role": "agent", "_count": { "role": 20 } } ],
  "ticketsByStatus": [ … ], "ticketsByDepartment": [ … ], "ticketsByPriority": [ … ]
} }
```

### POST `/api/admin/announcements` — `announcements:send`
Broadcast an `announcement` notification. Body: `{ "targetRole": "all | employee | agent | supervisor | admin", "title": "…", "body": "…" }`. → `{ "data": { "recipientCount": 42 } }`

### GET `/api/admin/agent-load` — supervisor / admin
Agents with their open-ticket counts:
```json
{ "data": [ { "id": "…", "name": "…", "department": "IT", "isActive": true, "_count": { "assignedTickets": 3 } } ],
  "meta": { "total": 20 } }
```

### GET `/api/admin/supervisor/escalations` — supervisor / admin
Escalated/open tickets for supervisor handling. → `{ "data": [ …Ticket ], "meta": { total } }`

### GET `/api/admin/supervisor/dashboard` — supervisor / admin
Department-scoped supervisor metrics: `{ openEscalations, unassignedTickets, resolvedToday, agents, department }`.

### GET `/api/admin/agent/metrics` — agent / admin
Personal agent performance: `{ assigned, resolved, escalated, inProgress, resolutionRate }`.

---

## Data shapes

`Ticket`, `User`, `Notification`, `Comment`, and `ActivityLog` field definitions are in [DATABASE_DESIGN.md](DATABASE_DESIGN.md). `SafeUser` is the user object with `passwordHash` stripped.

---

## Step 2 — CometChat endpoints

Implemented on the `cometchat-integration` branch (see [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) and [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md)). Router mounts in `backend/src/app.ts`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/cometchat/auth-token` | authenticated | Mint a per-user CometChat auth token server-side (syncs the user first if needed). → `{ "cometchatAuthToken": "…", "authToken": "…" }`. REST/Auth key never leaves the server. |
| POST | `/webhooks/cometchat` | Basic Auth (edge) | Receive CometChat events; responds `200` immediately and processes async. Handles `message_sent`, `moderation_engine_blocked`, `call_ended`/`meeting_ended`. |
| GET | `/api/admin/moderation` | admin | Paginated `pending` moderation queue. Query: `page`, `limit`. |
| POST | `/api/admin/moderation/:id/action` | admin | Body `{ "action": "dismiss" \| "block" }` — dismiss, or block (deletes the sender's CometChat account). |
| POST | `/api/admin/webhooks/:id/retry` | admin | Re-process a `failed` webhook event. |

**Auth-flow change (Step 2):** `POST /api/auth/login` and `POST /api/auth/register` responses gain a `cometchatAuthToken` field (string, or `null` if CometChat token generation fails — app auth still succeeds). All other Step 1 endpoints are unchanged.
