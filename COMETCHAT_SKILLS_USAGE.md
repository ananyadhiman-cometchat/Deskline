# CometChat Skills Usage — DeskLine (Step 2)

> How **CometChat Skills** were used to build the DeskLine ↔ CometChat integration on the **`cometchat-integration`** branch. The goal is to show the Skills were understood and used effectively — not merely that the integration compiled. Documented on `main` for full coverage.

---

## Which Skills were used

The project pins CometChat Skills in **`skills-lock.json`** (hash-verified, sourced from the `cometchat/cometchat-skills` GitHub repo). Four skills were locked and used:

| Skill | What it covers |
|---|---|
| **`cometchat`** | Core integration — SDK/UI Kit setup, user management, auth tokens, groups, messaging, webhooks, moderation |
| **`cometchat-calls`** | Voice & video calling — Calls SDK init and call UI |
| **`cometchat-a11y`** | Accessibility of the chat UI |
| **`cometchat-i18n`** | Internationalization of chat surfaces |

Because they're pinned in `skills-lock.json` with a computed hash, the exact skill revision used during development is reproducible.

This document follows the assignment's required outline: **which skills, what each helped with, prompts/workflows, problems solved, code areas, limitations/manual changes, learnings, before/after.**

---

## What each skill helped with

| Area | Skill(s) | Code produced / improved |
|---|---|---|
| Server-side auth token endpoint | `cometchat` | `backend/src/modules/cometchat/cometchat-auth.service.ts`, `cometchat.controller.ts`, `cometchat.route.ts` → `POST /api/cometchat/auth-token` |
| REST client (v3) | `cometchat` | `cometchat-client.ts` (`https://{appId}.api-{region}.cometchat.io/v3`, `CometChatApiError`) |
| User sync + tags | `cometchat` | `cometchat-sync.service.ts` (`syncNewUser`, `batchSyncUsers`, retry/backoff, 409→update) |
| Group chat model | `cometchat` | `cometchat-chat.service.ts` (`createTicketConversation`, `createEscalationGroup`, `addMemberToTicketGroup`) |
| Conversation lifecycle | `cometchat` | `cometchat-lifecycle.service.ts` (`onTicketStatusChange`, end/reactivate) |
| AI agent | `cometchat` | `cometchat-ai.service.ts` (AI-agent user, greeting, human handoff preserving history) |
| Moderation queue | `cometchat` | `cometchat-moderation.service.ts` + `cometchat-moderation.route.ts` |
| Webhooks | `cometchat` | `cometchat-webhook.service.ts` + `cometchat-webhook.route.ts` (`/webhooks/cometchat`) |
| Web SDK/UI Kit + provider | `cometchat`, `cometchat-a11y`, `cometchat-i18n` | `web/src/cometchat/CometChatProvider.tsx`, `TicketChatSection`, `AgentInbox`, `ModerationQueue` |
| Calling | `cometchat-calls` | `web/src/cometchat/components/CallButtons.tsx`, `hooks/useCometChatCall.ts`, Calls SDK init |
| Mobile SDK/UI Kit | `cometchat`, `cometchat-calls` | `mobile_app/lib/cometchat/*` |

---

## Prompts / workflows used

Representative prompts driven through the Skills, each grounded in the existing DeskLine code:

- *"Initialise the CometChat JS SDK and UI Kit from `VITE_COMETCHAT_APP_ID` / `VITE_COMETCHAT_REGION`, log the user in with a backend-minted auth token, and register the FCM token for push."*
- *"Add a backend endpoint that mints a per-user CometChat auth token using the REST API key; never send the key to the client."*
- *"Given our `users` table, write an idempotent sync that creates a CometChat user per app user (UID = `users.id`) tagged `role:{role}` and `dept:{dept}`, with retry and 409-as-update."*
- *"Model every ticket chat as a private group `ticket-{ticketId}` so escalation just adds the supervisor and preserves history."*
- *"Create a `/webhooks/cometchat` handler that responds 200 immediately, logs every event to `webhook_event_logs` idempotently, and on `moderation_engine_blocked` creates a moderation-queue item and notifies admins."*
- *"For Information tickets, have a CometChat AI-agent user answer in-chat and hand off to a human on request, keeping the transcript."* (`cometchat-calls` used similarly for the call buttons.)

Workflow pattern: **scope the task → let the Skill generate against the real files → review the diff → adapt to DeskLine's conventions (module/service split, Zod validation, `AppError` + `{ error: { code, message } }` envelope, Pino logging) → run the module's Vitest suite.**

---

## Problems solved with the Skills

- **Keeping keys server-side** — generated the token endpoint + REST client instead of the tempting client-side Auth Key shortcut.
- **Identity without drift** — UID = app id fell straight out of our `users` table; no mapping layer.
- **History-preserving escalation** — the groups-from-the-start model (rather than 1:1→migrate) came out of modelling every ticket as a group, making escalation a one-line "add member".
- **Idempotent sync & webhooks** — retry/backoff, 409-as-update, and event-id de-duplication so re-seeds and CometChat re-deliveries are safe.
- **Not breaking app notifications** — CometChat push was layered onto the existing FCM funnel with the two sources kept distinct.

---

## Limitations & manual changes required

- **Conventions** — generated handlers were rewritten to DeskLine's service/controller split, Zod boundaries, error envelope, and logging.
- **Webhook security** — the Skill scaffolded the handler; we chose **Basic Auth** at the edge (dashboard-configured) and left `COMETCHAT_WEBHOOK_SECRET` reserved for a future HMAC check rather than shipping an unverified signature path.
- **Ticket ↔ conversation lookup** — real webhook payloads sent conversation ids in several shapes (`group_…`, raw, `receiver`); the lookup was hardened by hand to tolerate all of them.
- **AI provider** — the in-chat AI reply reuses the backend LLM service (`generateTicketResponse`) rather than a CometChat-native bot, so answers share one code path with the Step 1 auto-reply.
- **Graceful degradation** — login/register returning `cometchatAuthToken: null` on failure, and background sync on register, were added so CometChat outages never block core auth.
- **a11y / i18n** — the `cometchat-a11y` and `cometchat-i18n` skills guided UI adjustments but still needed manual wiring into our component structure.

---

## Learnings

- Skills are most effective when the **existing schema and module layout are given as context** — the UID and tag design, and the group-per-ticket model, followed directly from our data model.
- Treat generated code as a **reviewed draft**: it accelerates boilerplate (SDK init, REST client, webhook plumbing, sync) so effort concentrates on the domain-specific 20% (escalation ownership, resolution lifecycle, moderation actions).
- In an "add chat to an existing app" task, the dominant risk is **regression**, not missing features — the Skills helped keep CometChat additive (coexisting push, preserved app notifications, graceful degradation), which is exactly what the assignment weights.

---

## Before / after examples

**Before (Step 1)** — ticket chat is a placeholder; messaging is DB comments:
```tsx
// web/src/components/tickets/ChatPlaceholder.tsx  → "Chat available in Step 2"
// Comments via POST /api/tickets/:id/comments
```
**After (Step 2)** — live CometChat group mounted on the ticket:
```tsx
// web/src/pages/shared/TicketDetailPage.tsx → <TicketChatSection> when ticket.cometchatConvoId exists
// CometChatMessageList + MessageComposer + MessageHeader + participants sidebar (live presence)
```

**Before** — Information-ticket AI reply is a one-shot comment (Step 1, Gemini/mock). **After** — a CometChat **AI-agent user** answers in-chat and hands off to a human, preserving history (`cometchat-ai.service.ts`).

**Before** — the backend has no knowledge of chat events. **After** — `message_sent` / `moderation_engine_blocked` / `call_ended` webhooks drive activity logs, the moderation queue, and call records ([COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md)).

**Before** — no real-time calling. **After** — `cometchat-calls` wired the Calls SDK and `CometChatCallButtons` into the chat header.

---

## Related docs
- [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) — the integration the Skills implemented
- [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md) — webhook flow
- [DECISION_LOG.md](DECISION_LOG.md#step-2--cometchat-integration) — decisions & alternatives
