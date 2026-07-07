# CometChat Webhooks — DeskLine (Step 2)

> **Status:** Step 2 design. Built on the `cometchat-integration` branch. This documents the real-world webhook use cases where CometChat chat events drive DeskLine's ticket state and admin visibility.

---

## Why webhooks

Chat is not just conversation — in a support tool, chat events *mean something* about the ticket. Webhooks let CometChat tell the backend "a message was sent", "a conversation ended", "a message was flagged", and the backend reacts by updating tickets, logging activity, and alerting admins. This keeps the ticket the single source of truth while chat happens in CometChat.

---

## Endpoint

**`POST /webhooks/cometchat`** (backend).

Processing pipeline for every event:

1. **Verify** the request is genuinely from CometChat (see Security below). Reject otherwise.
2. **Log** the raw event to `webhook_event_logs` with `status: received`.
3. **Dispatch** to the handler for `event_type`.
4. **Mark** `status: processed` (and `processed_at`), or `status: failed` with `error_message` if the handler throws.

Because every event is logged first, the **admin webhook event log** shows exactly what arrived and whether it succeeded — even for events with no handler.

### `webhook_event_logs` model

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `event_type` | text | e.g. `message.sent`, `conversation.ended`, `message.flagged` |
| `payload` | JSONB | full raw webhook payload |
| `status` | enum | `received` / `processed` / `failed` |
| `error_message` | text? | populated when `failed` |
| `processed_at` | timestamp? | |
| `created_at` | timestamp | |

Added on the `cometchat-integration` branch (specified in [SCHEMA.md](SCHEMA.md) and [DATABASE_DESIGN.md](DATABASE_DESIGN.md#step-2-additions-planned)).

---

## Security validation

- The endpoint is treated as **public but authenticated by signature/secret**: CometChat is configured to send a shared secret / signature header, which the backend verifies before processing. Requests failing verification are rejected with `401` and not logged as processed.
- Raw body is captured for signature verification.
- The handler is **idempotent** where it mutates ticket state (re-delivery of the same event does not double-apply).

---

## Implemented webhook use cases

At least four events are processed and visible in the admin log (Step 2 acceptance criterion). The core three that change application state:

### 1. `message.sent` → activity log + ticket activity
When a message is sent in a ticket conversation:
- Write an `activity_logs` entry (`action: 'cometchat_message'`, `entity_type: 'ticket'`, `entity_id` = the linked ticket).
- Bump the ticket's `last_activity_at` (feeds the inactivity / auto-close logic).

This mirrors the assignment's canonical example — *"when a message is sent, create an activity log in the application database"*.

### 2. `conversation.ended` → mark ticket resolved
When a ticket's conversation ends:
- Look up the ticket by `cometchat_convo_id`.
- Transition it to **`resolved`** and fire the standard resolution-confirmation notification to the employee (reusing the Step 1 [notification funnel](NOTIFICATION_FLOW.md)).

Chat completion thus drives ticket lifecycle automatically.

### 3. `message.flagged` → notify admin (moderation)
When AI Moderation flags a message:
- Write a `moderation_flags` row so it appears in the **Admin moderation queue** (`GET /api/admin/moderation`).
- Send an in-app `cometchat`-type notification to admins.

Target: the flagged message appears in the queue within ~10 seconds of being flagged.

### 4. Call / group events → admin visibility
Call started/ended and group-membership events are logged to `webhook_event_logs` and surfaced in the admin dashboard, giving admins visibility into chat and call activity.

Additional candidate use cases (from the assignment's examples) that fit DeskLine: *when a support conversation is created, assign it to an available agent*; *when a conversation becomes inactive, create a follow-up task*.

---

## Admin visibility

- **Webhook Event Log** (admin dashboard) — every event received, its `event_type`, `status`, and a payload preview.
- **Moderation Queue** — flagged messages with dismiss/block actions.
- **Activity Log** — chat-driven activity entries alongside app activity.

---

## Demo (Phase 3)

From [DEMO_GUIDE.md](DEMO_GUIDE.md):
1. End a ticket chat → `conversation.ended` fires → ticket auto-marked **Resolved**.
2. Admin opens the **Webhook Event Log** → the live demo events are visible with `processed` status.
3. Admin opens the **Moderation Log** → the flagged message record with the action taken.

---

## Configuration

Configure the webhook in the CometChat dashboard:
- **URL:** `https://<your-host>/webhooks/cometchat`
- **Events:** `message.sent`, `conversation.ended`, `message.flagged`, call/group events.
- **Secret/signature:** set the shared secret that the backend verifies.

Server env: the webhook secret plus the CometChat REST credentials from [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md).

## Related docs
- [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) — overall integration design
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md#step-2-additions-planned) — `webhook_event_logs` / `moderation_flags`
- [DECISION_LOG.md](DECISION_LOG.md#decision-17-cometchat-push-moderation--webhooks) — why webhooks over polling
