# CometChat Webhooks — DeskLine (Step 2)

> The real webhook integration, implemented on the **`cometchat-integration`** branch (`backend/src/modules/cometchat/cometchat-webhook.*`). CometChat chat events drive DeskLine's ticket state, moderation queue, and admin-visible activity. Documented on `main` for full coverage.

---

## Why webhooks

In a support tool, chat events *mean something* about the ticket. Webhooks let CometChat tell the backend "a message was sent", "a message was blocked by moderation", "a call ended", and the backend reacts — logging activity, generating AI replies, queuing flagged messages, and recording call activity. The ticket stays the source of truth while chat lives in CometChat.

---

## Endpoint

**`POST /webhooks/cometchat`** — mounted in `backend/src/app.ts` as `app.use('/webhooks/cometchat', cometchatWebhookRouter)`.

Handler (`cometchat-webhook.route.ts`) is deliberately thin:
1. Validate that `body.trigger` exists (else `400`).
2. **Respond `200` immediately** and process **asynchronously** in the background — CometChat best practice, so a slow handler never causes ret\-storms or timeouts.
3. Any error during background processing is logged and recorded on the event row; it never affects the HTTP response.

Response codes: `200` accepted · `400` missing `trigger` · `500` unexpected error.

---

## Security

- The endpoint is secured with **HTTP Basic Authentication** configured in the CometChat dashboard (credentials embedded in the webhook URL, verified at the reverse-proxy / platform edge) — **not** an HMAC signature scheme. `COMETCHAT_WEBHOOK_SECRET` is reserved in env for a future signature check.
- Processing is **idempotent**: `processWebhookPayload()` derives a stable `eventId` from `trigger` + message/session id + timestamp and skips anything already processed, so CometChat re-deliveries never double-apply a ticket mutation.

---

## Event log — `webhook_event_logs`

Every event is logged before dispatch, so the admin log shows exactly what arrived and how it fared — even events with no handler.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `event_type` | text | the CometChat `trigger` (e.g. `message_sent`) |
| `payload` | JSONB | full raw payload |
| `status` | enum `WebhookStatus` | `received` → `processed` / `failed` |
| `error_message` | text? | set when `failed` |
| `processed_at` | timestamp? | |
| `created_at` | timestamp | |

Indexed on `event_type`, `status`, `created_at`. Added in migration `20260618115417_add_cometchat_tables` (see [DATABASE_DESIGN.md](DATABASE_DESIGN.md#step-2-additions-cometchat)).

### Payload shape (CometChat v3)
```json
{ "trigger": "message_sent", "data": { }, "appId": "…", "region": "…", "webhook": "…" }
```

---

## Handled events

### 1. `message_sent`
`cometchat-webhook.service.ts` looks up the ticket by `cometchat_convo_id` (tolerating raw `conversationId`, `receiver`, and `group_`-stripped variants), then:
- writes an `activity_logs` entry (`action: 'chat_message_sent'`),
- bumps `tickets.last_activity_at` (feeds the inactivity / auto-close logic),
- **AI auto-response** — if the ticket is `information` sub-type, no human agent is assigned yet, the sender is not the AI agent, and the message is non-empty text: it asynchronously generates a reply (`generateAndSendAIResponse()` → `generateTicketResponse()` with the last ~5 comments as context), sends it into the group as the AI-agent user, and mirrors it to `ticket_comments` (`is_ai: true`).

This is the canonical "when a message is sent, create an activity log" use case, extended with live AI assistance.

### 2. `moderation_engine_blocked`
When AI Moderation blocks a message:
- extract message id, sender uid/name, content, and the rule/reason,
- resolve the associated ticket (if any),
- create a `ModerationQueueItem` (`moderation_queue`) with `status: pending`,
- notify **all active admins** via the Step 1 notification funnel with type `cometchat` ("Message Flagged — a message from *{sender}* was blocked: *{reason}*").

The item then appears in the admin **Moderation Queue** (`GET /api/admin/moderation`) for dismiss/block. See [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md#6-moderation).

### 3. `call_ended` / `meeting_ended`
Resolve the ticket by `cometchat_convo_id` (== session id), write a `call_ended` activity log, and record participants and duration (`destroyed_at − created_at`) for admin visibility.

> These three (four counting call/meeting) satisfy the "≥1 real-world webhook use case" requirement with margin, and each is visible in the admin log.

---

## Admin visibility & retry

- **Webhook Event Log** — every event with `event_type`, `status`, and payload, from `webhook_event_logs`.
- **Moderation Queue** — flagged messages with dismiss/block (`/api/admin/moderation`).
- **Activity Log** — `chat_message_sent` / `call_ended` entries alongside app activity.
- **Retry** — `POST /api/admin/webhooks/:id/retry` (admin-only) re-runs a `failed` event via `retryEvent(eventId)`.

---

## Demo (Phase 3)

From [DEMO_GUIDE.md](DEMO_GUIDE.md):
1. Send a chat message → `message_sent` fires → activity logged; on an Information ticket the AI replies in-chat.
2. Send a banned word → `moderation_engine_blocked` → item appears in the admin Moderation Queue; admins notified.
3. Start/end a call → `call_ended` logged.
4. Admin opens the **Webhook Event Log** → the live demo events are visible with `processed` status.

---

## Configuration

In the CometChat dashboard → Webhooks:
- **URL:** `https://<your-host>/webhooks/cometchat`
- **Auth:** Basic Auth (username/password embedded in the URL).
- **Triggers:** `message_sent`, `moderation_engine_blocked`, `call_ended` / `meeting_ended`.

Server env: the CometChat REST credentials from [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md#configuration-env) (`COMETCHAT_APP_ID`, `COMETCHAT_REGION`, `COMETCHAT_REST_API_KEY`, `COMETCHAT_AI_AGENT_UID`).

## Related docs
- [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) — overall integration design
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md#step-2-additions-cometchat) — `webhook_event_logs` / `moderation_queue`
- [DECISION_LOG.md](DECISION_LOG.md#decision-17-cometchat-push-moderation--webhooks) — why webhooks, and Basic Auth vs HMAC
