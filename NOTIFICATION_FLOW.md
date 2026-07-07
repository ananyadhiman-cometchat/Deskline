# Notification Flow — DeskLine

> How app-originated notifications work end to end: the single funnel that persists them, logs them, and pushes them via FCM; every trigger in the ticket lifecycle; and the auto-close job. CometChat-originated notifications (Step 2) are noted at the end. These app notifications are the ones that **must keep working after CometChat is integrated**.

---

## The funnel — `createNotification()`

Every app notification goes through one function so that persistence, audit, and delivery can never drift apart.

**File:** `backend/src/modules/notifications/notifications.service.ts`

```ts
createNotification(client, {
  actorId,          // who caused it
  userId,           // recipient
  type,             // NotificationType
  title, body,
  metadata?,        // stored in the activity log
})
```

Steps, in order:

1. **Look up the recipient** — fetch `id` and `fcmToken` for `userId`.
2. **Persist** — insert a `notifications` row (`is_read: false`). This is what the notification centre and admin notification log read.
3. **Audit** — insert an `activity_logs` row with `action: 'notification_sent'`, `entity_type: 'notification'`, and the metadata.
4. **Push (conditional)** — if the recipient has an `fcmToken`, call `sendPushNotification()`. **Push failure is non-fatal** — it's logged, never thrown, so a bad token can't roll back the notification.

If the recipient has **no `fcmToken`**, steps 2–3 still happen; only the push is skipped. In-app notifications therefore always work even without push configured.

> Persistence, audit, and delivery run sequentially (not in a single transaction). The DB row is the source of truth; push is best-effort.

---

## FCM push delivery

**File:** `backend/src/lib/firebase.ts`

- The **Firebase Admin SDK** is initialised once at startup from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
- If those env vars are unset, initialisation is skipped silently and `sendPushNotification()` is a no-op that returns `null` — the app runs fine without push in dev.
- `sendPushNotification(token, title, body)` sends a notification-payload message via `getMessaging().send()`. Errors are caught and logged; they never propagate.

**Token registration:** clients register their device/browser token via `PATCH /api/users/me/fcm-token`, which calls `updateFcmToken()` in `backend/src/modules/users/users.service.ts` and stores it on `users.fcm_token`. Web push additionally needs `VITE_FIREBASE_VAPID_KEY` at build time.

---

## Notification types

`NotificationType` enum (`ticket_update`, `assignment`, `escalation`, `announcement`, `cometchat`). Usage in Step 1:

| Type | Meaning | Used |
|---|---|---|
| `ticket_update` | Status changes, AI replies, resolution flow, comments, auto-close | ✅ heavily |
| `assignment` | Ticket assigned / reassigned / human-help requested / unassigned-to-supervisors | ✅ |
| `escalation` | Ticket escalated to a supervisor | ✅ |
| `announcement` | Admin broadcast | ✅ |
| `cometchat` | CometChat-originated events | ⏳ reserved for Step 2 (no Step 1 triggers) |

---

## Triggers across the ticket lifecycle

Every place `createNotification()` fires in Step 1. Files under `backend/src/modules/`.

| Event | Recipient | Type | Source |
|---|---|---|---|
| **Ticket created — `information`** → AI auto-reply posted | Employee (creator) | `ticket_update` | `tickets.service.ts` `createTicketWithRouting()` |
| **Ticket created — `action`/`conversation`** → agent assigned | Assigned agent | `assignment` | `tickets.service.ts` |
| **Ticket created — `escalation`** → supervisor assigned | Assigned supervisor | `escalation` | `tickets.service.ts` |
| **Ticket created — no assignee found** | All active dept supervisors | `assignment` | `tickets.service.ts` `notifyDepartmentSupervisors()` |
| **Status changed (any)** | Employee (owner) | `ticket_update` | `tickets.service.ts` `notifyTicketOwnerUpdate()` |
| **Ticket resolved** → confirmation request | Employee | `ticket_update` | `tickets.service.ts` `updateTicketStatus()` |
| **Ticket escalated** | Best-fit supervisor | `escalation` | `tickets.service.ts` `escalateTicketInternal()` |
| **Ticket escalated** | Employee | `ticket_update` | `tickets.service.ts` |
| **Ticket reassigned** | New assignee | `assignment` | `tickets.service.ts` `updateTicketAssignee()` |
| **Request human help** (AI ticket → human) | Assigned agent | `assignment` | `tickets.service.ts` `requestHumanHelp()` |
| **Resolution confirmed** → closed | Employee | `ticket_update` | `tickets.service.ts` `confirmResolution()` |
| **Resolution confirmed** | Assigned agent | `ticket_update` | `tickets.service.ts` `confirmResolution()` |
| **Resolution rejected** → reopened | Assigned agent | `ticket_update` | `tickets.service.ts` `rejectResolution()` |
| **Comment added** | Counterparty (employee ↔ assignee) | `ticket_update` | `comments.service.ts` `createTicketComment()` |
| **Admin announcement** | All users (or a targeted role) | `announcement` | `admin.controller.ts` |
| **Auto-close (24h)** | Employee | `ticket_update` | `ticket-auto-close.job.ts` |

Role summary:

| Role | Receives |
|---|---|
| Employee | Status changes, resolution requests, AI replies, agent comments, auto-close, announcements |
| Agent | New assignments, reassignments, employee comments, resolution accept/reject, human-help requests, announcements |
| Supervisor | Escalations, unassigned tickets in their department, announcements |
| Admin | Targeted announcements |

---

## AI auto-reply (Information tickets)

**File:** `backend/src/modules/ai/ai.service.ts` → `generateTicketResponse(title, description)`.

- Backed by **Google Gemini** (`@google/genai`, model `gemini-2.5-flash`) when `GEMINI_API_KEY` is set.
- If the key is **absent**, returns a labelled mock response (`[Automated AI Response - Mock Mode]`) so demos never depend on an external call.

When an `information` ticket is created, the AI answer is stored as a `ticket_comments` row with `is_ai: true`, an `ai_reply_sent` activity log is written, and the employee gets a `ticket_update` notification ("An AI assistant replied to your … ticket."). No human agent is assigned unless the employee later calls `request-human-help`.

---

## Auto-close job (cron)

**File:** `backend/src/modules/tickets/ticket-auto-close.job.ts` → `startTicketAutoCloseJob()`, started from `backend/src/server.ts`.

- Runs **every hour** (`setInterval`, 1h).
- Finds tickets that are `resolved` with `resolution_confirmation_requested_at` older than **24 hours**.
- For each: sets `status: closed` + `closed_at`, writes a `ticket_auto_closed` activity log, and notifies the employee (`ticket_update`, "…automatically closed after 24 hours…").
- Errors are logged, never thrown — a bad ticket can't kill the loop.

---

## Manual send

`POST /api/notifications/send` lets an authenticated user push a notification of any type to a specific user through the same funnel — used for ad-hoc/admin messaging and for testing push delivery.

---

## Step 2 — CometChat-originated notifications (planned)

Added on the `cometchat-integration` branch, these **coexist** with the app funnel above (they do not replace it):

| Trigger | Recipient | Channel |
|---|---|---|
| New chat message (recipient offline) | Recipient | CometChat push (FCM/APNs) |
| Incoming / missed call | Callee | CometChat push + in-app banner |
| Message auto-flagged by moderation | Admin | In-app notification (`cometchat` type) |

The client distinguishes **app events** (this document) from **CometChat events** by source so both streams display correctly. The Step 1 acceptance criterion — *existing app notifications continue working after CometChat integration* — is verified by re-running the triggers in the table above post-integration. See [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md).
