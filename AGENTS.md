# AGENTS.md — DeskLine

> Instructions for any coding agent working on this repository. Read this file in full before touching any code. Do not skip sections.

---

## What This Project Is

DeskLine is a lightweight internal support ticketing system for small SaaS companies. It has:
- A **React 18 + TypeScript** web app
- A **Flutter** mobile app
- A **Node.js / Express** backend with Prisma + PostgreSQL
- **CometChat** integration for real-time chat (Step 2 only)

The project is divided into two delivery steps. **Do not implement Step 2 features during Step 1 work.**

---

## Non-Negotiable Rules

1. **Read SCHEMA.md before touching anything database-related.** Every model, enum, index, and field contract is defined there. If it conflicts with the Prisma file, raise it — do not silently pick one.
2. **Read SCOPE_OF_WORK.md before implementing any feature.** If a feature is marked Step 2, do not build it in Step 1.
3. **Never hard-code credentials.** All secrets go in `.env`. Never commit `.env`.
4. **Never expose the CometChat Auth Key to the client.** Server-side only, always.
5. **Status transitions are enforced in the service layer**, not just the route handler. If a caller tries to move `open → resolved` directly, reject it.
6. **Every action that mutates data must write an `ActivityLog` record** using the exact action strings from SCHEMA.md. No freeform strings.
7. **Every FCM push must also create a `Notification` DB record.** They are never sent without a record.
8. **Do not generate migrations with `prisma db push`.** Use `prisma migrate dev` with a descriptive name.

---

## Project Structure

```
deskline/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route files, one per resource
│   │   ├── controllers/     # Request/response handling only — no business logic
│   │   ├── services/        # Business logic, DB access, routing decisions
│   │   ├── middleware/       # Auth, RBAC, error handling, validation
│   │   ├── lib/             # Prisma client, FCM client, CometChat client (Step 2)
│   │   ├── types/           # Shared TypeScript types and Zod schemas
│   │   └── seed/            # Seed scripts
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env
├── web/                     # React app
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/           # Zustand stores
│   │   ├── hooks/           # TanStack Query hooks
│   │   ├── lib/             # API client, auth helpers
│   │   └── types/
└── mobile/                  # Flutter app
```

---

## Step 1 — Core App

**Scope:** Auth, tickets, notifications, RBAC, admin dashboard, seed data. No CometChat.

### What to build

#### Backend

**Auth (`/api/auth`)**
- `POST /register` — hash password with bcrypt (min 12 rounds), create user, return JWT pair
- `POST /login` — verify password, issue access token (15min) + refresh token (7d), update `lastLoginAt`, store token hash in `refresh_tokens`
- `POST /logout` — revoke refresh token (`revokedAt = now()`)
- `POST /refresh` — validate refresh token hash, issue new pair, mark old token replaced
- `GET /me` — return current user from JWT

**Tickets (`/api/tickets`)**
- `POST /` — validate with Zod, run routing logic (see below), write `ActivityLog`, fire FCM notification to assigned agent
- `GET /` — filtered by role:
  - `employee` → own tickets only
  - `agent` → assigned tickets only, filterable by status and sub-type
  - `supervisor` → all tickets, filterable; escalation queue is `subType=escalation AND (status=escalated OR status=open)`
  - `admin` → all tickets
- `GET /:id` — role-gated: employee can only fetch own ticket; agent can only fetch assigned
- `PATCH /:id` — update `status` or `agentId` (supervisor/admin only for `agentId`); enforce status transition rules; write `ActivityLog`; fire notification
- `POST /:id/escalate` — only callable by agent or supervisor; changes `status → escalated`, reassigns to a supervisor; writes log; fires notification

**Ticket Routing Logic** (in `services/ticket.service.ts`):
```
subType = information  → fire simulated AI reply (create Notification to employee, write ActivityLog `ai_reply_sent`); assign no agent
subType = escalation   → find supervisor: department match + lowest open ticket count; assign; notify supervisor
subType = action|conversation → find agent: department match + lowest open ticket count + isActive=true + role=agent; assign; notify agent
no agent available     → leave agentId null; notify supervisors of the department
```

**Users & Admin (`/api/admin`)**
- All routes require `role = admin`
- `GET /users` — paginated list, filterable by role and department
- `POST /users` — create user (admin-created users skip self-registration)
- `PATCH /users/:id` — edit name, email, department, role
- `PATCH /users/:id/deactivate` — set `isActive = false`; do not hard-delete
- `GET /activity-logs` — paginated, filterable by `userId`, `entityType`, `action`, date range
- `GET /notification-logs` — paginated notification history for admin view

**Notifications (`/api/notifications`)**
- `GET /` — notification history for the authenticated user; auto-mark as read
- `POST /send` — internal use only; not callable by clients directly (or gate behind admin)

**Notification triggers** — implement these in `services/notification.service.ts`:

| Trigger | Recipient | `type` |
|---|---|---|
| Ticket created + assigned | Agent | `assignment` |
| Ticket status updated | Employee (ticket owner) | `ticket_update` |
| Ticket escalated | Supervisor | `escalation` |
| Ticket assigned to supervisor | Supervisor | `assignment` |
| Admin announcement | Target role group or all | `announcement` |

Each trigger: create `Notification` record + send FCM if `fcmToken` is present.

**RBAC middleware** — implement as Express middleware in `middleware/rbac.ts`:
- Attach decoded JWT to `req.user`
- Export helpers: `requireRole(...roles)`, `requireOwnership(getEntityUserId)`
- Apply to every protected route — never leave a route without auth middleware

#### Web App

**Screens to build (Step 1):**

| Screen | Role | Key behaviours |
|---|---|---|
| Login | All | Email + password; stores access token in memory, refresh token in httpOnly cookie |
| Register | All | Self-registration; default role = `employee` until Admin changes it |
| Employee Dashboard | Employee | Active tickets list; "Raise Ticket" button; unread notification count |
| Raise Ticket | Employee | Form: title, description, category, sub-type, priority; Zod validation |
| Ticket Detail | Employee | Status timeline; if sub-type = `information`, show AI reply panel |
| Notification Centre | All | In-app notification list; mark read |
| Agent Inbox | Agent | Queue of assigned tickets; filter by status and sub-type |
| Ticket Detail (Agent) | Agent | Status controls; escalate button |
| All Tickets | Supervisor | Filterable full list; escalation queue tab; reassign control |
| Agent Load View | Supervisor | Table: agent name, open count, resolved count |
| Admin Dashboard | Admin | User management, ticket analytics, activity log, notification log |
| User Management | Admin | CRUD table; role and department filters; deactivate action |
| Profile | All | View/edit own name and email |

**State management rules:**
- **Zustand** for auth state (`user`, `accessToken`) and UI state (sidebar, modal open/closed)
- **TanStack Query** for all server data — never store API responses in Zustand
- Access token lives in memory (Zustand). Refresh token in httpOnly cookie
- On 401, automatically call `/auth/refresh` once, retry the original request, then log out if refresh fails

#### Mobile App

Mirror all Employee and Agent screens from the web app. Supervisor and Admin are web-only.

- Use `Dio` for HTTP with an interceptor that handles token refresh
- Use `flutter_secure_storage` for the refresh token
- Push notifications via `firebase_messaging` — handle foreground, background, and terminated states
- Navigation via `GoRouter`

#### Seed Script

File: `backend/src/seed/seed.ts`

Target counts: 5 admins, 10 supervisors, 20 agents (spread across IT/HR/General), 65+ employees, 50+ tickets.

Seed must produce:
- Tickets in every status, every sub-type, every category
- At least 10 unassigned tickets (to demo the queue)
- Realistic `ActivityLog` records (at least 3 per ticket)
- Notification records with mixed `isRead` values
- One active `RefreshToken` per seeded user (or skip — login will create them)

---

## Step 2 — CometChat Integration

**Do not start Step 2 until Step 1 acceptance criteria are fully met.**

Before writing any Step 2 code:
1. Add `WebhookEventLog` and `ModerationFlag` models to `schema.prisma` (see SCHEMA.md)
2. Run `prisma migrate dev --name add_cometchat_step2`
3. Add CometChat env vars: `CC_APP_ID`, `CC_REGION`, `CC_AUTH_KEY`, `CC_WEBHOOK_SECRET`

### What to build

**User sync**
- On `POST /auth/register` — after DB user creation, call CometChat REST API to create the CC user with UID = app user UUID; store `cometchatUid`
- Bulk sync script for existing seeded users (`seed/cc-sync.ts`)

**Auth token endpoint**
- `POST /api/cometchat/auth-token` — authenticated route; calls CC API to generate user auth token; returns token to client; never logs it

**Chat auto-open (web)**
- Conversation sub-type: when agent claims ticket → backend sets `cometchatConvoId` on ticket → frontend initialises CometChat React UI Kit in the Ticket Detail view
- Escalation: when ticket is escalated → backend adds Supervisor to the CC group conversation

**Webhook receiver**
- `POST /webhooks/cometchat` — verify HMAC signature; create `WebhookEventLog` with `status = received`; dispatch to handler based on `eventType`; update `status` to `processed` or `failed`

| `eventType` | Handler behaviour |
|---|---|
| `message.sent` | Write `ActivityLog` (`cc_message_sent`); update `ticket.lastActivityAt` |
| `conversation.ended` | Set ticket `status → resolved`; write `ActivityLog`; notify employee |
| `message.flagged` | Create `ModerationFlag`; notify all admins in-app |

**Admin moderation**
- `GET /api/admin/moderation` — list `ModerationFlag` records where `action = pending`
- `POST /api/admin/moderation/:id/action` — body: `{ action: "dismissed" | "sender_blocked" }`; update flag; if `sender_blocked`, call CC API to block the user; write `ActivityLog`

**Webhook event log**
- `GET /api/admin/webhook-events` — paginated `WebhookEventLog` list; filterable by `eventType` and `status`

**Push notifications (Step 2 additions)**
- CometChat push runs independently via CC SDK — do not intercept it
- Ensure existing app FCM push notifications still fire; they are separate from CC push
- Test both in parallel — CC push for messages/calls, app push for ticket events

---

## Validation Rules

Use **Zod** on the backend for all request bodies. Mirror the same schemas in the frontend with **React Hook Form + Zod**.

Key schemas:

**Ticket creation:**
```ts
z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['IT', 'HR', 'General']),
  subType: z.enum(['information', 'action', 'conversation', 'escalation']),
  priority: z.enum(['low', 'medium', 'high']),
})
```

**Ticket status update:**
```ts
z.object({
  status: z.enum(['open', 'in_progress', 'escalated', 'resolved', 'closed']),
  agentId: z.string().uuid().optional(),  // supervisor/admin only
})
```
Validate the transition in the service layer after parsing.

**User creation (admin):**
```ts
z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'agent', 'supervisor', 'admin']),
  department: z.enum(['IT', 'HR', 'General']),
})
```

---

## Error Handling

All API errors must use a consistent shape:
```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket with ID xyz does not exist"
  }
}
```

Standard HTTP status codes:
- `400` — validation error (include Zod error details)
- `401` — not authenticated
- `403` — authenticated but not authorised for this action
- `404` — entity not found
- `409` — conflict (e.g. ticket already claimed)
- `500` — unexpected server error (log the real error, return generic message)

Implement a global Express error handler in `middleware/errorHandler.ts`. Never leak stack traces to the client.

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/deskline

# JWT
JWT_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# CometChat (Step 2)
CC_APP_ID=
CC_REGION=
CC_AUTH_KEY=
CC_WEBHOOK_SECRET=
```

---

## API Response Conventions

- All list endpoints return: `{ data: [], meta: { total, page, pageSize } }`
- All single-entity endpoints return: `{ data: { ...entity } }`
- Timestamps are ISO 8601 strings
- UUIDs are strings
- Snake_case from DB is transformed to camelCase before sending to client (Prisma handles this via `@map`)
- Never return `passwordHash` in any response — exclude it explicitly in every user query

---

## Testing Targets

### Unit tests (Jest)
- Ticket routing logic — all four sub-types produce correct assignments
- Status transition validator — all invalid transitions are rejected
- RBAC middleware — each role gets correct access/deny for representative routes
- Notification service — correct recipient and type for each trigger

### Integration tests
- `POST /auth/register` → user in DB, JWT returned
- `POST /tickets` with `subType=information` → AI reply notification created
- `PATCH /tickets/:id` with invalid transition → `400` returned
- `POST /tickets/:id/escalate` → `agentId` set to a supervisor, notification created

---

## Definition of Done

A task is complete when:
- [ ] Feature works end-to-end (backend + web + mobile where applicable)
- [ ] Zod validation in place on backend and frontend
- [ ] RBAC enforced — test with a role that should NOT have access
- [ ] `ActivityLog` written for every mutation
- [ ] `Notification` record + FCM fired for every defined trigger
- [ ] No `console.log` left in production paths
- [ ] TypeScript — no `any` types, no `@ts-ignore`
- [ ] Prisma queries use `select` or `omit` to exclude `passwordHash`

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| Putting business logic in route handlers | Business logic in `services/`; controllers only parse/respond |
| Skipping `ActivityLog` writes | Every mutation needs a log — add it to the service before returning |
| Sending FCM without a DB `Notification` record | Always create the record first |
| Using `prisma db push` | Always use `prisma migrate dev` |
| Storing CometChat Auth Key in frontend env | Server-side only, never in client build |
| Letting agents update `agentId` | Only supervisor and admin can reassign |
| Forgetting to exclude `passwordHash` from queries | Use `omit: { passwordHash: true }` on every user select |
| Using freeform strings in `ActivityLog.action` | Use only the strings defined in SCHEMA.md |
| Implementing Step 2 features early | Check SCOPE_OF_WORK.md — if it says Step 2, leave it |
