# CometChat Integration — DeskLine (Step 2)

> **What this is:** the real CometChat integration for DeskLine, implemented on the **`cometchat-integration`** branch (created from `production-ready-app`, which stays frozen). This document lives on `main` for full documentation coverage and describes the code as actually built.
>
> **Guiding constraint:** CometChat is added **additively** — every Step 1 workflow ([NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md)) keeps working. Integration is designed to **degrade gracefully**: if CometChat is unreachable, login/registration and ticketing still succeed.

---

## Products & packages

| Layer | Package | Version |
|---|---|---|
| Web chat SDK | `@cometchat/chat-sdk-javascript` | ^4.1.11 |
| Web UI Kit | `@cometchat/chat-uikit-react` | ^6.5.2 |
| Web calls | `@cometchat/calls-sdk-javascript` | ^5.0.1 |
| Mobile UI Kit | `cometchat_chat_uikit` (Flutter) | ^5.0.0 |
| Mobile calls | `cometchat_calls_sdk` (Flutter) | ^5.0.2 |
| Backend | REST API v3 (axios client) | `https://{APP_ID}.api-{REGION}.cometchat.io/v3` |

CometChat capabilities used: user management + tags, **groups** (all ticket chats), auth tokens, messaging, **AI agent** for Information tickets, **AI moderation**, **webhooks**, and **voice/video calling**.

---

## Configuration (env)

**Backend (server-side only — never shipped to the client):**

| Var | Purpose |
|---|---|
| `COMETCHAT_APP_ID` | Application ID |
| `COMETCHAT_REGION` | Region (e.g. `us`, `eu`, `in`) |
| `COMETCHAT_REST_API_KEY` | Server-to-server REST key (all admin/user/group/message ops) |
| `COMETCHAT_WEBHOOK_SECRET` | Reserved for webhook auth (webhook currently secured via Basic Auth — see [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md)) |
| `COMETCHAT_AI_AGENT_UID` | UID of the CometChat AI-agent user (default `deskline-ai-agent`) |

**Web (baked into the bundle at build time — public values only):** `VITE_COMETCHAT_APP_ID`, `VITE_COMETCHAT_REGION`.

**Mobile:** `COMETCHAT_APP_ID` / `COMETCHAT_REGION` via `--dart-define` at build time.

The **Auth Key / REST API Key never reach the client** — the browser and app only ever receive a per-user **auth token** minted by the backend.

---

## 1. Identity, auth token & the login/register flow

- **UID = app user ID.** Each user's CometChat UID equals their `users.id`, stored in `users.cometchat_uid`. No mapping table.
- **Server-side auth tokens.** `backend/src/modules/cometchat/cometchat-auth.service.ts` exposes `generateToken(userId)` and `ensureUserAndGenerateToken(userId)` (which first syncs the user to CometChat if `cometchat_uid` is still null, then mints a token with `force: true`). Surfaced at `POST /api/cometchat/auth-token`.
- **Woven into auth.** `loginUser()` and `registerUser()` (`backend/src/modules/auth/auth.service.ts`) return a `cometchatAuthToken` alongside the app's `accessToken`/`refreshToken`. If token generation fails, the field is `null` and **auth still succeeds** — the client can fetch a token later from `/api/cometchat/auth-token`. On registration, `syncNewUser()` runs in the background so a slow/unavailable CometChat never blocks signup.
- **No separate CometChat login.** The web `CometChatProvider` (`web/src/cometchat/CometChatProvider.tsx`) initialises the SDK with the public App ID + Region and calls `loginWithAuthToken()` using the backend token — transparent to the user.

---

## 2. User sync & lifecycle

`backend/src/modules/cometchat/cometchat-sync.service.ts`:

- **`syncNewUser(user)`** — creates the CometChat user (UID = app id) with tags, **retries up to 3× with exponential backoff**, treats `409 Conflict` as "already exists → update", and writes `cometchat_uid` back to the DB.
- **`batchSyncUsers(users)`** — lists existing CometChat UIDs first (paginated), updating those and creating the rest. Idempotent, so re-seeding never trips the user limit or 409s. Used to bulk-sync the seeded users.
- **`updateUserTags(userId, role, department)`** — re-tags on role/department change.
- **`retryPendingSync()`** — sweeps users whose `cometchat_uid` is still null.

`backend/src/modules/cometchat/cometchat-lifecycle.service.ts` ties chat to ticket state via `onTicketStatusChange(ticketId, old, new)`:
- `→ closed` → `endConversation()` (deletes the CometChat conversation).
- `→ resolved` → keep open (the 24h confirmation window).
- `resolved → open/in_progress` → `reactivateConversation()` posts a "conversation reactivated" system message.

Deactivating/blocking a user deletes them from CometChat (see Moderation `blockSender`).

---

## 3. Chat model — **groups, not 1:1**

> **Key design decision:** *every* ticket conversation is a **private CometChat group** named `ticket-{ticketId}` — even employee↔agent chats. This gives one consistent render path on web/mobile and means escalation just **adds a member** to the existing group, preserving all history. (See [DECISION_LOG.md](DECISION_LOG.md#decision-16-chat-model--groups-not-11).)

`backend/src/modules/cometchat/cometchat-chat.service.ts`:

| Function | Creates | Members (scope) |
|---|---|---|
| `createTicketConversation(ticketId, employeeUid, agentUid)` | group `ticket-{id}`, tag `ticket-conversation` | employee (participant), agent (admin) |
| `createEscalationGroup(ticketId, employeeUid, supervisorUid, agentUid?)` | group `ticket-{id}`, tag `escalation` | employee (participant), supervisor (admin), agent (participant) |
| `createAIConversation(ticketId, employeeUid)` | group `ticket-{id}`, tags `ticket-conversation`,`ai-assisted` | employee (participant), AI agent (admin) |
| `addMemberToTicketGroup(ticketId, memberUid, scope?)` | — | adds a member to the existing group (handoff / supervisor join) |

The group GUID is stored on `tickets.cometchat_convo_id`. Because escalation and AI→human handoff **add to the same group**, message history is never lost.

Agent availability + active conversations surface in the **agent inbox** (`web/src/pages/agent/ConversationsPage.tsx` → `AgentInbox` using `CometChatConversations`), with an online/away/offline status control.

---

## 4. AI agent for Information tickets

`backend/src/modules/cometchat/cometchat-ai.service.ts` — the AI is a **dedicated CometChat user** (`COMETCHAT_AI_AGENT_UID`, default `deskline-ai-agent`), not a native bot:

- `createAIAgentConversation(ticketId, employeeUid)` opens the group and posts a greeting from the AI user.
- When a message arrives in an Information-ticket group (via the `message_sent` webhook), the backend generates a reply with `generateTicketResponse()` (the backend LLM service) using recent ticket comments as context, sends it into the group as the AI user, and mirrors it to `ticket_comments` (`is_ai: true`).
- `handleHumanHelpRequest(ticketId)` posts a handoff message and **adds the human agent to the existing group**, so the agent inherits the full AI transcript.

This is the Step 2 realisation of Step 1's simulated auto-reply — now delivered live in chat. See [NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md#ai-auto-reply-information-tickets).

---

## 5. Tags & role-based access control

Every synced user carries tags `role:{role}` and `dept:{department}`, mirroring the app's own RBAC so the chat layer enforces the same permissions:

| App concept | Tag | Effect |
|---|---|---|
| role | `role:employee` / `role:agent` / `role:supervisor` / `role:admin` | who may start/join conversations; agent-inbox filtering |
| department | `dept:IT` / `dept:HR` / `dept:General` | routing & grouping |

Employees only ever belong to their own ticket group (they can't DM other employees); agents/supervisors/admins have the broader reach ticket handling and escalation require. Group membership + scope (`participant` / `admin`) enforces who is in which conversation.

---

## 6. Moderation

CometChat **AI Moderation** flags messages; a `moderation_engine_blocked` webhook delivers them to the backend, which stores a `ModerationQueueItem` (`moderation_queue` table) and notifies admins (`cometchat` notification type). Admin-only surface:

- `GET /api/admin/moderation` — paginated `pending` queue (`web/src/cometchat/components/ModerationQueue.tsx` → `web/src/pages/admin/ModerationPage.tsx`).
- `POST /api/admin/moderation/:id/action` with `{ "action": "dismiss" | "block" }` — **dismiss** marks the item reviewed; **block** deletes the sender's CometChat account (`blockSender`) and records the action. Both write an activity log.

Flagged messages surface only to admins, never to end users. The Step 1 human-moderator role is replaced by AI Moderation.

---

## 7. Webhooks

`POST /webhooks/cometchat` receives CometChat events, logs each to `webhook_event_logs`, and drives ticket state (`message_sent` → activity + AI reply; `moderation_engine_blocked` → moderation queue; `call_ended`/`meeting_ended` → call activity). Full detail — security model, idempotency, per-event handlers, admin retry — in [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md).

---

## 8. Push notifications (coexistence)

CometChat push is registered **alongside** the Step 1 FCM funnel, not instead of it:
- The web `CometChatProvider` registers the FCM token with CometChat for chat/call push and shows in-app toasts for incoming messages/calls via a global message listener.
- Existing app notifications ([NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md)) keep firing unchanged; the two streams are distinguished by source.
- Mobile registers push via `mobile_app/lib/cometchat/services/cometchat_push_service.dart`.

---

## 9. Voice & video calling

The Calls SDK (`@cometchat/calls-sdk-javascript` / `cometchat_calls_sdk`) is initialised in the provider. Call buttons (`web/src/cometchat/components/CallButtons.tsx` → `CometChatCallButtons`) live in the ticket chat header; call lifecycle events arrive via webhooks (`call_ended`/`meeting_ended`) and are logged for admin visibility.

---

## Frontend map

**Web** (`web/src/cometchat/`): `CometChatProvider.tsx` (init + login + push + listeners), `config.ts` (reads `VITE_COMETCHAT_*`), `hooks/useCometChatAuth.ts`, `hooks/useCometChatCall.ts`, `components/{ModerationQueue,CallButtons}.tsx`. Chat UI: `TicketChatSection` on the ticket detail page (`CometChatMessageList` / `MessageComposer` / `MessageHeader` + a participants sidebar with live presence); `AgentInbox` (`CometChatConversations`).

**Mobile** (`mobile_app/lib/cometchat/`): `cometchat_config.dart` (dart-define), `cometchat_init.dart` (singleton initializer w/ retry), `services/cometchat_auth_service.dart`, `services/cometchat_push_service.dart`, plus `providers/` and `widgets/`.

---

## Acceptance criteria (Step 2)

- [x] SDK initialises on app load (with retry/backoff) without errors.
- [x] Auth token generated server-side; Auth/REST keys never exposed to the client.
- [x] Existing app notifications continue working (graceful-degradation design).
- [x] Ticket chat opens as a group; escalation adds the supervisor with history preserved.
- [x] CometChat push registered on web and mobile; calling enabled.
- [x] Tags applied to all users by role and department.
- [x] AI Moderation flags → admin moderation queue with dismiss/block.
- [x] Webhook events processed and logged (`message_sent`, `moderation_engine_blocked`, `call_ended`/`meeting_ended`) + admin retry.
- [x] Agent inbox shows active conversations with availability.
- [x] New users auto-synced on registration; seeded users synced in bulk.

---

## Related docs
- [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md) — webhook endpoint, security, events
- [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md) — how CometChat Skills were used
- [DECISION_LOG.md](DECISION_LOG.md#step-2--cometchat-integration) — Step 2 decisions & alternatives
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md#step-2-additions-cometchat) — `moderation_queue`, `webhook_event_logs`
- [NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md) — the app notifications that keep working
