# CometChat Integration — DeskLine (Step 2)

> **Status:** This document describes the Step 2 CometChat integration plan and design. Step 1 (this `main` / `production-ready-app` state) ships the full application **without** CometChat; the integration is built additively on the `cometchat-integration` branch, created **from** `production-ready-app`, which remains unchanged after Step 1 approval.
>
> The guiding constraint: **add CometChat without breaking any existing workflow.** Everything in [NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md) must still pass afterward.

---

## Why CometChat, and where it plugs in

DeskLine already models the support domain (tickets, roles, agents, escalation). The seams for real-time chat were designed into Step 1:

- `users.cometchat_uid` — holds each user's CometChat identity.
- `tickets.cometchat_convo_id` — links a ticket to its CometChat conversation.
- `TicketSubType.conversation` / `escalation` — the sub-types whose tickets open a chat.
- `NotificationType.cometchat` — reserved so CometChat events sit alongside app notifications.
- `ticket_comments` — the Step 1 in-app comment thread that CometChat's real-time chat augments.

## CometChat products used

| Product | Purpose |
|---|---|
| JavaScript Chat SDK + **React UI Kit v5** | Web chat UI on the ticket page and agent inbox |
| Flutter Chat SDK + **Flutter UI Kit** | Mobile chat UI |
| **Tags & RBAC** | Role/department-based messaging permissions |
| **AI Moderation** | Auto-flag profanity/images → admin queue |
| **Webhooks** | Chat events drive ticket state ([COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md)) |
| **Push Notifications** | Message/call alerts coexisting with app FCM push |
| Voice & Video Calling | Escalation calls between employee and agent |
| AI Agent / AgentKit | Replaces the Step 1 simulated AI reply for Information tickets |

---

## 1. Identity & auth token strategy

- **UID = app user ID.** Every user's CometChat UID equals their `users.id` UUID (stored in `users.cometchat_uid`). No mapping table, no identity drift. (See [DECISION_LOG.md](DECISION_LOG.md#decision-13-cometchat-integration-approach--uid-strategy).)
- **Server-side auth tokens only.** The client calls `POST /api/cometchat/auth-token`; the backend uses the CometChat **Auth Key** (a server env var — never shipped to the client) to mint a per-user auth token. The SDK initialises with the public **App ID + Region** and logs in with that token.
- **No separate CometChat login.** The app's own JWT session is the trigger; the CometChat login happens transparently after app login.

Environment (server only): `COMETCHAT_APP_ID`, `COMETCHAT_REGION`, `COMETCHAT_AUTH_KEY`, plus a REST API key for admin operations (user sync, moderation, groups).

---

## 2. User sync

Both existing and future users must exist in CometChat with consistent identity.

- **Bulk sync of seeded users** — a one-time script/Data Import creates a CometChat user for each of the 105 seeded app users, UID = app id, with role/department **tags** applied. This makes every demo account chat-ready immediately.
- **Create-or-sync on registration** — the `POST /api/auth/register` flow (and admin `POST /api/admin/users`) creates the matching CometChat user inline and stores `cometchat_uid`.
- **Profile updates** propagate name/tag changes to CometChat.
- **Deactivation** — deactivating an app user deactivates the CometChat user (soft); deletion is soft.

Expected behaviour: seeded users can chat right after login; new users are synced automatically; identity stays consistent app ↔ CometChat.

---

## 3. Tags & role-based access control

Every synced user is tagged by **role** and **department**, mirroring the app's own RBAC so the chat layer enforces the same real-world permissions.

| App concept | CometChat tag(s) | Effect |
|---|---|---|
| `role` (employee/agent/supervisor/admin) | `role:employee`, `role:agent`, … | Who may start/join conversations |
| `department` (IT/HR/General) | `dept:IT`, `dept:HR`, `dept:General` | Routing & grouping |

Access rules (allowed vs restricted communication):
- **Employees cannot DM other employees** — they only chat within their own ticket (with the assigned agent/supervisor).
- **Agents/supervisors/admins** have broader reach for support conversations and escalation groups.
- Tags are also used for **filtering** (agent inbox), **grouping** (escalation groups), and **webhook/event handling**.

The mapping between app roles and CometChat roles/tags, plus concrete allowed/restricted examples, is documented here so the RBAC design is auditable.

---

## 4. Chat flows

### 1:1 — Conversation tickets
When an agent claims a **Conversation** sub-type ticket, a **1:1 conversation** (employee ↔ agent) auto-opens on the ticket page; `tickets.cometchat_convo_id` is stored. Most tickets never escalate, so starting 1:1 keeps them clean.

### 1:1 → group — Escalation
On escalation, the **supervisor is added to the existing conversation to form a 3-way group, preserving message history** (via the Data Import / group-migration path). This matches the escalation-ownership rule — the supervisor becomes the active owner without losing chat context. (This is the trickiest part of the integration and is isolated behind the escalation handler.)

### Agent chat / inbox
The **agent inbox** lists active CometChat conversations with each agent's **availability/presence**. Assignment and availability logic reuse the Step 1 department + load-balancing routing.

### Real-time expectations
One-on-one and group chat, real-time delivery, **typing indicators**, **online/offline presence**, and read/delivery receipts — all via the UI Kits, with live UI updates and no page refresh.

### Voice & video
Employees can request a call from the ticket page; the agent accepts from the inbox. Call events feed push and the webhook log.

---

## 5. Push notifications (coexistence)

CometChat push (message/call alerts) is **added alongside** the existing app FCM funnel — it does not replace it.

- Existing app notifications ([NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md)) continue firing unchanged.
- CometChat delivers push for 1:1 messages, group messages, incoming/missed calls, and relevant chat events.
- The client **distinguishes app events from CometChat events** by source so both display correctly.
- Notification permission and device-token handling reuse the Step 1 FCM registration (`PATCH /api/users/me/fcm-token`) and, for web, the existing VAPID key.

---

## 6. AI Moderation

CometChat **AI Moderation** runs automatically (profanity filter + image moderation). Flagged messages surface **only in the Admin moderation queue** — not to end users. New endpoints:

- `GET /api/admin/moderation` — the flagged-message queue.
- `POST /api/admin/moderation/:id/action` — dismiss, or block the sender.

Flagged events also arrive via the `message.flagged` webhook, which writes a `moderation_flags` row and notifies admins (target: flagged messages appear in the queue within ~10s). The Step 1 human-moderator role is intentionally **replaced** by AI Moderation.

---

## 7. Webhooks

A secured `POST /webhooks/cometchat` endpoint receives CometChat events, logs them to `webhook_event_logs`, and reacts. Full detail — endpoint, security validation, event handlers, and admin visibility — is in [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md).

---

## Acceptance criteria (Step 2)

- [ ] SDK initialises on app load without errors.
- [ ] Auth token generated server-side; Auth Key never exposed to the client.
- [ ] All existing app notifications continue working after integration.
- [ ] 1:1 chat auto-opens for Conversation tickets when an agent claims them.
- [ ] Escalation group chat works — supervisor added, history preserved.
- [ ] CometChat push delivered on web and mobile.
- [ ] Tags applied to all users by role and department.
- [ ] AI Moderation auto-flags profanity/images; visible in the admin queue within ~10s.
- [ ] ≥4 webhook events processed and visible in the admin log.
- [ ] Agent inbox shows active conversations with availability.
- [ ] New users auto-synced to CometChat on registration; seeded users chat after login.

---

## Related docs
- [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md) — webhook use cases and processing
- [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md) — how CometChat Skills were used
- [DECISION_LOG.md](DECISION_LOG.md#step-2--cometchat-integration) — Step 2 decisions & alternatives
- [NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md) — the app notifications that must keep working
