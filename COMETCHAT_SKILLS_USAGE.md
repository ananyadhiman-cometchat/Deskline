# CometChat Skills Usage — DeskLine (Step 2)

> **Status:** Step 2 documentation. This records **how CometChat Skills** (the AI-assisted CometChat integration skills / tooling) were used to build the DeskLine ↔ CometChat integration on the `cometchat-integration` branch. The goal is to show that the Skills were understood and used effectively — not merely that the integration compiled.

---

## What "CometChat Skills" are here

CometChat Skills are the AI-assisted, task-scoped capabilities used to scaffold and wire CometChat into an existing app — user sync, SDK/UI-Kit setup, tags & RBAC, moderation, webhooks, and push. Each skill takes the existing codebase as context and generates or improves the integration code, which is then reviewed and adapted by hand.

This document follows the assignment's required outline: **which skills, what each helped with, prompts/workflows, problems solved, code areas touched, limitations/manual changes, learnings, and before/after examples.**

---

## Skills used and what each helped with

| Skill / task area | Helped with | Code areas generated or improved |
|---|---|---|
| **SDK & UI Kit setup (web)** | Installing `@cometchat/chat-sdk-javascript` + React UI Kit v5, initialising with App ID + Region, mounting chat on the ticket page | `web/src/lib/cometchat.ts`, ticket-detail chat panel (replacing `ChatPlaceholder.tsx`) |
| **SDK & UI Kit setup (mobile)** | Flutter Chat SDK + UI Kit init, wiring into the ticket screen | `mobile_app/lib/features/chat/*` |
| **Server-side auth token** | Generating a per-user CometChat auth token without exposing the Auth Key | `backend` `POST /api/cometchat/auth-token` + a CometChat service module |
| **User sync** | Bulk-syncing the 105 seeded users and creating CometChat users on registration; UID = app id | seed/sync script + hook in the auth `register` flow |
| **Tags & RBAC** | Applying `role:*` / `dept:*` tags and expressing who-can-message-whom | user-sync tagging + conversation-start guards |
| **1:1 → group migration** | Adding the supervisor to an existing conversation on escalation, preserving history | escalation handler |
| **Moderation** | Enabling AI Moderation and surfacing flagged messages to admins | `GET /api/admin/moderation`, `POST /api/admin/moderation/:id/action`, admin queue UI |
| **Webhooks** | The `/webhooks/cometchat` endpoint, signature verification, and event handlers | webhook route + `webhook_event_logs` handlers |
| **Push notifications** | CometChat push coexisting with the existing FCM funnel | push registration reuse |

---

## Prompts / workflows used

Representative prompts driven through the Skills (paraphrased), each grounded in the existing DeskLine code:

- *"Initialise the CometChat JS SDK using App ID and Region from env, and expose a `loginCometChat(uid, authToken)` helper the SPA calls after app login."*
- *"Add a backend endpoint that mints a CometChat auth token server-side using the Auth Key; never send the Auth Key to the client."*
- *"Given our `users` table, write an idempotent sync that creates a CometChat user per app user with UID = `users.id` and tags for role and department."*
- *"On agent claiming a `conversation` ticket, open a 1:1 conversation between employee and agent and store the conversation id on the ticket."*
- *"On escalation, add the supervisor to the existing conversation as a group, preserving message history."*
- *"Create a `/webhooks/cometchat` handler that verifies the signature, logs every event to `webhook_event_logs`, and on `conversation.ended` marks the linked ticket resolved."*
- *"Enable AI Moderation and route `message.flagged` events to an admin moderation queue."*

Workflow pattern: **scope the task → let the Skill generate against the real files → review the diff → adapt to DeskLine's module conventions (Zod validation, service layer, error envelope) → test.**

---

## Problems solved with the Skills

- **Identity mapping without drift** — the Skill defaulted to UID = app user id, eliminating a mapping table and matching our Step 1 `cometchat_uid` design.
- **Keeping the Auth Key secret** — generated the server-side token endpoint rather than the tempting client-side shortcut.
- **History-preserving escalation** — produced the 1:1→group migration path, the hardest single piece, using CometChat's group/import APIs instead of a lossy "new group" approach.
- **Not breaking app notifications** — the push skill added CometChat push *alongside* the existing FCM funnel and kept the two event sources distinguishable, satisfying the core assignment constraint.
- **Webhook boilerplate** — scaffolded the log-then-dispatch pipeline and signature verification so we focused on the ticket-state logic.

---

## Limitations & manual changes required

The generated code was a strong starting point but always needed adaptation:

- **Module conventions** — generated handlers were rewritten to match DeskLine's service/controller split, Zod-validated boundaries, `AppError` + `{ error: { code, message } }` envelope, and Pino logging.
- **RBAC alignment** — tag-based restrictions had to be reconciled with the app's own route-level RBAC so the two enforcement layers agree (chat can't allow what the API forbids).
- **Idempotency** — sync and webhook handlers were hardened to be safely re-runnable (re-delivery, re-seed) beyond the first-pass generation.
- **Migration edge cases** — the 1:1→group escalation needed manual handling for tickets that were already groups or already escalated.
- **Env & secrets** — wiring App ID/Region/Auth Key/webhook secret into our existing env config and `.env.production.example` was done by hand to keep secrets server-side only.

---

## Learnings

- CometChat Skills are most effective when the **existing schema and module structure are given as context** — the UID and tag design fell out naturally from our `users` table.
- Treat generated code as a **reviewed draft**: it accelerates the 80% of boilerplate (SDK init, webhook plumbing, sync) so effort goes to the 20% that's domain-specific (escalation ownership, resolution flow).
- The biggest risk in a "add chat to an existing app" task is **regression**, not new features — the Skills helped keep CometChat additive (coexisting push, preserved app notifications), which is exactly what the assignment weights.

---

## Before / after examples

**Before (Step 1)** — ticket page chat placeholder:
```tsx
// web/src/components/tickets/ChatPlaceholder.tsx
// Static "Chat available in Step 2" panel; comments handled via /api/tickets/:id/comments
```

**After (Step 2)** — live CometChat conversation mounted on the ticket:
```tsx
// Ticket detail renders the CometChat UI Kit conversation for tickets[cometchat_convo_id],
// with real-time delivery, typing indicators, and presence.
```

**Before** — Information ticket AI reply (Step 1, simulated):
```
Gemini (or mock) reply stored as a ticket_comments row (is_ai = true).
```
**After** — same seam, upgraded to CometChat AI Agent / AgentKit for richer, in-chat responses.

**Before** — no server knowledge of chat events. **After** — `message.sent` / `conversation.ended` / `message.flagged` webhooks drive activity logs, ticket resolution, and the moderation queue ([COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md)).

---

## Related docs
- [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) — the integration design the Skills implemented
- [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md) — webhook flow
- [DECISION_LOG.md](DECISION_LOG.md#step-2--cometchat-integration) — decisions & alternatives
