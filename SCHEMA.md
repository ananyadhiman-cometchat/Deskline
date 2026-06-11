# DeskLine — Database Schema Reference

> Authoritative schema doc for the coding agent. All models, enums, field contracts, and indexing decisions are defined here. Do not deviate from this without updating this file first.

---

## Schema Issues Resolved

The Prisma schema has been audited against the Scope of Work. The following gaps were identified and resolved in this document:

| Issue | Resolution |
|---|---|
| `webhook_event_logs` table missing from Prisma (SOW Step 2) | Added `WebhookEventLog` model below — add to schema before Step 2 work |
| `ModerationQueue` implied by `/api/admin/moderation` endpoints but not modelled | Added `ModerationFlag` model below — Step 2 |
| `Ticket` hot-path indexes on `employeeId`, `agentId`, `status` | Added `@@index` directives for queue, detail, and filter queries |
| `Notification` compound index on `userId` + `isRead` | Added for notification bell queries |
| `ActivityLog` compound index on `entityType` + `entityId` | Added for admin drill-down queries |
| `RefreshToken.replacedById` is a bare String, not a self-referential FK | Acceptable — rotation chain tracked by value, not enforced by DB |
| `User.lastFailedLoginAt` not in SOW | Keep — valid security field, used for brute-force detection |
| Custom Comments vs CometChat | Divergence approved by user: Added `TicketComment` model for basic chat. |

---

## Enums

### `UserRole`
```
employee | agent | supervisor | admin
```
Maps directly to the four roles in the SOW permissions matrix. Used for RBAC middleware on every protected route.

### `Department`
```
IT | HR | General
```
Used on `User` to define which agent pool they belong to. Agent assignment logic matches `Ticket.category` to `User.department`.

### `TicketCategory`
```
IT | HR | General
```
Must always match the `Department` enum values — they are intentionally parallel. Category drives the agent pool filter during assignment.

### `TicketSubType`
```
information | action | conversation | escalation
```
This is the most important routing field in the system.

| Value | Routes To | Chat Opens | Step |
|---|---|---|---|
| `information` | AI agent (simulated in Step 1) | No | Step 1 |
| `action` | Human agent (dept + load) | No | Step 1 |
| `conversation` | Human agent (dept + load) | Yes, auto-opens | Step 2 |
| `escalation` | Supervisor directly | Yes, auto-opens | Step 1 routing / Step 2 chat |

### `TicketPriority`
```
low | medium | high
```

### `TicketStatus`
```
open | in_progress | escalated | resolved | closed
```
Valid transitions:
- `open` → `in_progress` (agent claims ticket)
- `in_progress` → `escalated` (agent escalates)
- `in_progress` → `resolved` (agent resolves, or `conversation.ended` webhook fires)
- `escalated` → `resolved` (supervisor resolves)
- `resolved` → `closed`

Closure occurs when:
- Employee confirms the resolution
- System automatically closes after 24 hours without employee response
- Admin performs an override action

Closed tickets must always have previously reached `resolved`.

**Enforce status transition logic in the service layer, not just the API handler.**

### `NotificationType`
```
ticket_update | assignment | escalation | announcement | cometchat
```
- `cometchat` type is used for webhook-triggered notifications (Step 2)
- All other types fire from app-originated events (Step 1)

### `WebhookEventStatus` *(Step 2)*
```
received | processed | failed
```

---

## Models

### `User`
```prisma
model User {
  id                String    @id @default(uuid())
  name              String
  email             String    @unique
  passwordHash      String    @map("password_hash")
  role              UserRole
  department        Department
  isActive          Boolean   @default(true) @map("is_active")
  lastLoginAt       DateTime? @map("last_login_at")
  lastFailedLoginAt DateTime? @map("last_failed_login_at")
  cometchatUid      String?   @map("cometchat_uid")   // Step 2 — set on register
  fcmToken          String?   @map("fcm_token")        // nullable until device registers
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  tickets           Ticket[]       @relation("EmployeeTickets")
  assignedTickets   Ticket[]       @relation("AgentTickets")
  notifications     Notification[]
  activityLogs      ActivityLog[]
  refreshTokens     RefreshToken[]

  @@map("users")
}
```

**Field contracts:**
- `email` — unique, stored lowercase, never verified (out of scope)
- `passwordHash` — bcrypt hash only, never plaintext
- `role` — set on registration; can be changed by Admin only
- `department` — required for all roles; determines agent pool membership
- `isActive` — soft delete; deactivated users cannot log in but records are preserved
- `cometchatUid` — must equal the app `id` (UUID). Set during registration in Step 2. Not nullable after Step 2
- `fcmToken` — updated by the client on every login; may be null if user has never pushed a token
- `lastFailedLoginAt` — updated on failed login attempts; used for brute-force rate limiting

---

### `RefreshToken`
```prisma
model RefreshToken {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  tokenHash    String    @unique @map("token_hash")
  expiresAt    DateTime  @map("expires_at")
  revokedAt    DateTime? @map("revoked_at")
  replacedById String?   @map("replaced_by_id")   // UUID of the token that replaced this one
  createdAt    DateTime  @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

**Field contracts:**
- `tokenHash` — SHA-256 hash of the raw token; raw token never stored
- `revokedAt` — set on logout or rotation; null means token is still valid
- `replacedById` — tracks rotation chain for audit purposes; not a FK constraint

---

### `Ticket`
```prisma
model Ticket {
  id               String         @id @default(uuid())
  title            String
  description      String
  category         TicketCategory
  subType          TicketSubType  @map("sub_type")
  priority         TicketPriority
  status           TicketStatus   @default(open)
  employeeId       String         @map("employee_id")
  agentId          String?        @map("agent_id")     // null until assigned
  lastActivityAt   DateTime?      @map("last_activity_at")
  cometchatConvoId String?        @map("cometchat_convo_id")  // Step 2
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  employee  User   @relation("EmployeeTickets", fields: [employeeId], references: [id])
  agent     User?  @relation("AgentTickets", fields: [agentId], references: [id])

  @@index([employeeId])              // employee ticket list
  @@index([agentId])                 // agent queue / supervisor load
  @@index([status])                  // global status filters
  @@index([category, status])        // agent queue filter
  @@index([subType, status])         // routing queries
  @@map("tickets")
}
```

**Field contracts:**
- `agentId` — null for unassigned tickets. For `escalation` sub-type, this is set to a Supervisor's ID
- `lastActivityAt` — updated on every status change and every CometChat message (Step 2 webhook). Used for inactivity detection
- `cometchatConvoId` — set when chat auto-opens (Step 2). Null for `information` and `action` sub-types
- `status` transitions must be validated in the service layer — see valid transitions under `TicketStatus`

**Assignment rules (enforced in service layer):**
1. Match `category` → `department` to find eligible agents
2. Filter to agents where `isActive = true` and `role = agent`
3. Within that pool, pick the agent with the lowest count of `status IN (open, in_progress)` tickets
4. For `escalation` sub-type — skip agent pool, assign to a Supervisor in the matching department

Escalation ownership rule:
- When a ticket is escalated, ownership transfers to the assigned supervisor.
- The original agent loses ownership.
- The supervisor becomes responsible for future ticket updates.
- Admin retains full override capability.

---

### `TicketComment`
```prisma
model TicketComment {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  userId    String   @map("user_id")
  body      String
  isAi      Boolean  @default(false) @map("is_ai")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@index([ticketId, createdAt])
  @@map("ticket_comments")
}
```

**Field contracts:**
- Custom model added to support basic communication instead of full CometChat (Step 2 divergence).
- `isAi` - true if the message was generated by the LLM system.

---

### `Notification`
```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id])

  @@index([userId, isRead])   // notification bell: unread count + list
  @@index([userId, createdAt]) // notification history
  @@map("notifications")
}
```

**Field contracts:**
- Every FCM push notification must also create a `Notification` record — in-app and push are always in sync
- `type = cometchat` is reserved for webhook-triggered notifications (Step 2)
- `isRead` is set to `true` on `GET /api/notifications` or explicit mark-read action

---

### `ActivityLog`
```prisma
model ActivityLog {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  action     String
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  metadata   Json
  createdAt  DateTime @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])   // admin drill-down: "show all logs for ticket X"
  @@index([createdAt])              // admin log feed sorted by time
  @@map("activity_logs")
}
```

**`action` value registry** — use these exact strings, never freeform:

| Action | entityType | When |
|---|---|---|
| `ticket_created` | `ticket` | Employee submits ticket |
| `ticket_assigned` | `ticket` | Agent assigned (auto or manual) |
| `ticket_claimed` | `ticket` | Agent self-claims from queue |
| `status_updated` | `ticket` | Any status change |
| `ticket_escalated` | `ticket` | Agent or supervisor escalates |
| `ticket_resolved` | `ticket` | Status set to resolved |
| `user_created` | `user` | Admin creates user |
| `user_updated` | `user` | Admin edits user |
| `user_deactivated` | `user` | Admin deactivates user |
| `role_changed` | `user` | Admin changes role |
| `notification_sent` | `notification` | Any notification fired |
| `login` | `user` | Successful login |
| `logout` | `user` | Logout |
| `ai_reply_sent` | `ticket` | Simulated AI auto-reply (Step 1) |
| `human_help_requested` | `ticket` | Employee requests a human after AI response |
| `resolution_confirmed` | `ticket` | Employee accepts resolution |
| `resolution_rejected` | `ticket` | Employee rejects resolution |
| `ticket_reopened` | `ticket` | Ticket returned to active handling |
| `ticket_auto_closed` | `ticket` | System closes after timeout |
| `cc_message_sent` | `ticket` | CometChat message logged (Step 2 webhook) |
| `cc_convo_ended` | `ticket` | conversation.ended webhook fired (Step 2) |
| `message_flagged` | `moderation_flag` | CometChat AI flagged a message (Step 2) |
| `moderation_action` | `moderation_flag` | Admin dismisses or blocks (Step 2) |

**`metadata` shape examples:**
```json
// status_updated
{ "oldStatus": "open", "newStatus": "in_progress", "agentId": "uuid" }

// ticket_escalated
{ "fromAgentId": "uuid", "toSupervisorId": "uuid", "reason": "payroll error" }

// notification_sent
{ "type": "assignment", "recipientId": "uuid", "ticketId": "uuid" }
```

---

### `WebhookEventLog` *(Step 2 — add to schema before Step 2 work begins)*
```prisma
enum WebhookEventStatus {
  received
  processed
  failed
}

model WebhookEventLog {
  id           String              @id @default(uuid())
  eventType    String              @map("event_type")    // "message.sent", "conversation.ended", "message.flagged"
  payload      Json
  status       WebhookEventStatus  @default(received)
  errorMessage String?             @map("error_message")
  processedAt  DateTime?           @map("processed_at")
  createdAt    DateTime            @default(now()) @map("created_at")

  @@index([eventType])
  @@index([status])
  @@index([createdAt])
  @@map("webhook_event_logs")
}
```

**Supported `eventType` values:**
- `message.sent` → log to `ActivityLog`
- `conversation.ended` → set ticket status to `resolved`, update `lastActivityAt`
- `message.flagged` → create `ModerationFlag` record, notify Admin

---

### `ModerationFlag` *(Step 2 — add to schema before Step 2 work begins)*
```prisma
enum ModerationAction {
  pending
  dismissed
  sender_blocked
}

model ModerationFlag {
  id              String           @id @default(uuid())
  messageId       String           @map("message_id")     // CometChat message ID
  conversationId  String           @map("conversation_id") // CometChat conversation ID
  senderId        String           @map("sender_id")       // CometChat UID = app user UUID
  flagReason      String           @map("flag_reason")     // e.g. "profanity", "image_unsafe"
  messagePreview  String           @map("message_preview") // truncated, for admin display
  action          ModerationAction @default(pending)
  reviewedBy      String?          @map("reviewed_by")     // Admin user ID
  reviewedAt      DateTime?        @map("reviewed_at")
  createdAt       DateTime         @default(now()) @map("created_at")

  @@index([action])
  @@index([createdAt])
  @@map("moderation_flags")
}
```

---

## Relationship Map

```
User ─────────────────────────────────────────────────────────
  │ role: employee  →  tickets (EmployeeTickets relation)
  │ role: agent     →  assignedTickets (AgentTickets relation)
  │ role: supervisor → assignedTickets (via escalation routing)
  │
  ├── Notification[]      (all roles receive notifications)
  ├── ActivityLog[]       (all roles generate activity)
  └── RefreshToken[]      (all roles have refresh tokens)

Ticket
  ├── employee  →  User (EmployeeTickets)
  └── agent     →  User? (AgentTickets) — null until assigned

WebhookEventLog            (standalone — no FK relations)
ModerationFlag             (standalone — references CC IDs, not User FK)
```

---

## Seed Data Targets

| Table | Target Count | Notes |
|---|---|---|
| `users` | 100+ | 5 admins, 10 supervisors, 20 agents, 65+ employees; spread across departments |
| `tickets` | 50+ | Spread across all 4 sub-types, 3 categories, all statuses |
| `notifications` | ~150 | At least 2–3 per user with mixed read/unread |
| `activity_logs` | ~200 | Realistic action history for all tickets |
| `refresh_tokens` | As needed | One active token per seeded user |

---

## Migration Notes

- Run `prisma migrate dev` with a descriptive name per feature, not a monolithic migration
- Step 2 models (`WebhookEventLog`, `ModerationFlag`) go in a separate migration named `add_cometchat_step2`
- Never run `prisma db push` in a team/CI environment — migrations only
- After adding indexes, verify with `EXPLAIN ANALYZE` on the three hottest queries: agent queue list, notification bell, admin activity log feed
