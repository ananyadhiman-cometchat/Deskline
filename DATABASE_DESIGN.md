# Database Design — DeskLine

> Data model for the DeskLine backend. Source of truth: `backend/prisma/schema.prisma`. Engine: **PostgreSQL 16** via **Prisma 7**. All tables use UUID primary keys and `snake_case` column names (mapped from `camelCase` model fields). For the annotated field-contract reference see [SCHEMA.md](SCHEMA.md).

---

## Overview

DeskLine is a relational domain: users create tickets, tickets accumulate comments and drive notifications, and every meaningful action is written to an activity log. A document store was rejected in favour of Postgres precisely because of these foreign-key relationships (see [DECISION_LOG.md](DECISION_LOG.md#decision-5-database--orm)).

### Entity-relationship overview

```
                ┌──────────────┐
                │    users     │
                └──────┬───────┘
      ┌────────────────┼───────────────┬────────────────┬───────────────┐
      │ 1:N (employee) │ 1:N (agent)   │ 1:N            │ 1:N           │ 1:N
      ▼                ▼               ▼                ▼               ▼
┌───────────┐   (assigned)     ┌──────────────┐  ┌──────────────┐ ┌───────────────┐
│  tickets  │◀────────────────▶│ notifications│  │ activity_logs│ │ refresh_tokens│
└─────┬─────┘                  └──────────────┘  └──────────────┘ └───────────────┘
      │ 1:N
      ▼
┌──────────────────┐
│ ticket_comments  │  (author → users)
└──────────────────┘
```

Relationships:
- **users → tickets** — two relations: `employee` (creator) and `agent` (assignee, nullable).
- **tickets → ticket_comments** — a ticket has many comments; each comment has an author (`users`) and may be an AI reply.
- **users → notifications / activity_logs / refresh_tokens** — one-to-many each.

---

## Enums

| Enum | Values | Used for |
|---|---|---|
| `UserRole` | `employee`, `agent`, `supervisor`, `admin` | RBAC on every protected route |
| `Department` | `IT`, `HR`, `General` | Agent pool a user belongs to |
| `TicketCategory` | `IT`, `HR`, `General` | Parallels `Department`; drives agent-pool matching |
| `TicketSubType` | `information`, `action`, `conversation`, `escalation` | **Primary routing field** (AI vs human vs supervisor) |
| `TicketPriority` | `low`, `medium`, `high` | Prioritisation |
| `TicketStatus` | `open`, `in_progress`, `escalated`, `resolved`, `closed` | Lifecycle state |
| `NotificationType` | `ticket_update`, `assignment`, `escalation`, `announcement`, `cometchat` | Notification classification (`cometchat` reserved for Step 2) |

`TicketSubType` routing:

| Value | Routes to | Chat opens | Step |
|---|---|---|---|
| `information` | AI agent (Gemini, mock fallback) | No | 1 |
| `action` | Human agent (dept + lowest load) | No | 1 |
| `conversation` | Human agent (dept + lowest load) | Yes (auto) | 2 chat |
| `escalation` | Supervisor directly | Yes (auto) | 1 routing / 2 chat |

---

## Tables

### `users`
Every actor in the system.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | text | |
| `email` | text | **unique** |
| `password_hash` | text | bcrypt hash — never returned by the API |
| `role` | `UserRole` | |
| `department` | `Department` | |
| `is_active` | boolean | default `true`; deactivation is soft |
| `last_login_at` | timestamp? | updated on login |
| `last_failed_login_at` | timestamp? | brute-force detection |
| `cometchat_uid` | text? | Step 2 — equals the app user id |
| `fcm_token` | text? | device token for FCM push |
| `created_at` / `updated_at` | timestamp | |

Relations: `tickets` (as employee), `assignedTickets` (as agent), `notifications`, `activityLogs`, `refreshTokens`, `ticketComments`.

### `refresh_tokens`
Rotating refresh-token store for JWT sessions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `token_hash` | text | **unique** — the token is stored hashed |
| `expires_at` | timestamp | |
| `revoked_at` | timestamp? | set on logout / rotation |
| `replaced_by_id` | text? | rotation chain (by value, not an enforced FK) |
| `created_at` | timestamp | |

Indexes: `user_id`, `expires_at`.

### `tickets`
The core work item.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `title` | text | |
| `description` | text | |
| `category` | `TicketCategory` | |
| `sub_type` | `TicketSubType` | routing driver |
| `priority` | `TicketPriority` | |
| `status` | `TicketStatus` | default `open` |
| `employee_id` | UUID | FK → users (creator) |
| `agent_id` | UUID? | FK → users (assignee), nullable until assigned |
| `last_activity_at` | timestamp? | updated on activity; feeds inactivity/auto-close |
| `resolved_at` | timestamp? | when marked resolved |
| `resolution_confirmation_requested_at` | timestamp? | starts the 24h auto-close window |
| `closed_at` | timestamp? | when closed |
| `cometchat_convo_id` | text? | Step 2 — links to the CometChat conversation |
| `created_at` / `updated_at` | timestamp | |

Indexes: `employee_id`, `agent_id`, `status`, `(category, status)`, `(sub_type, status)` — covering the queue, detail, and filter queries.

### `ticket_comments`
Threaded comments on a ticket, including AI replies.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `ticket_id` | UUID | FK → tickets |
| `user_id` | UUID | FK → users (author) |
| `body` | text | |
| `is_ai` | boolean | default `false`; `true` for Gemini auto-replies |
| `created_at` / `updated_at` | timestamp | |

Index: `(ticket_id, created_at)` for chronological loads.

> `ticket_comments` is a deliberate divergence from the original scope: a lightweight in-app comment thread stands in for chat in Step 1. Real-time chat arrives via CometChat in Step 2.

### `notifications`
In-app notification records (also the source for push).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users (recipient) |
| `type` | `NotificationType` | |
| `title` | text | |
| `body` | text | |
| `is_read` | boolean | default `false` |
| `created_at` | timestamp | |

Indexes: `(user_id, is_read)` for the bell badge, `(user_id, created_at)` for the list.

### `activity_logs`
Append-only audit trail of every meaningful action.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users (actor) |
| `action` | text | e.g. `ticket_created`, `status_updated`, `escalated`, `notification_sent` |
| `entity_type` | text | e.g. `ticket`, `user`, `notification` |
| `entity_id` | UUID | affected record |
| `metadata` | JSONB | free-form context (old/new status, etc.) |
| `created_at` | timestamp | |

Indexes: `user_id`, `(entity_type, entity_id)` for drill-down, `created_at` for the feed.

---

## Migrations

Migrations live in `backend/prisma/migrations/` and are applied with `prisma migrate deploy` (production) or `npm run prisma:migrate` (dev). Applied to date:

| Migration | Adds |
|---|---|
| `20260610081312_init` | Initial schema — users, tickets, notifications, activity_logs, refresh_tokens |
| `20260611074623_add_ticket_resolution_tracking` | `resolved_at`, `resolution_confirmation_requested_at`, `closed_at` on tickets |
| `20260611123135_add_ticket_comments` | `ticket_comments` table |

The backend Docker image runs `prisma migrate deploy` → seed → server on startup, so a fresh database is provisioned automatically.

---

## Seed data

`backend/prisma/seed.ts` (idempotent) creates:

- **105 users** — 5 admins, 10 supervisors, 20 agents, 70 employees, spread across IT/HR/General. Shared demo password `Password123!`.
- **60 tickets** — evenly spread across every category, sub-type, priority, and status; first 50 assigned, last 10 unassigned.
- **60 notifications** and **~180 activity logs** so every list/dashboard view has realistic data.

See [DEMO_GUIDE.md](DEMO_GUIDE.md) for credentials and [TESTING_NOTES.md](TESTING_NOTES.md) for how the seed supports testing.

---

## Step 2 additions (planned)

Two models are specified for the CometChat integration and are added on the `cometchat-integration` branch (see [SCHEMA.md](SCHEMA.md) and [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md)):

- **`webhook_event_logs`** — `event_type`, `payload` (JSONB), `status` (`received`/`processed`/`failed`), `error_message`, `processed_at`, `created_at`.
- **`moderation_flags`** — AI-flagged messages surfaced in the admin moderation queue.

The `users.cometchat_uid` and `tickets.cometchat_convo_id` columns already exist in the Step 1 schema to hold the mapping without a later migration to core tables.
