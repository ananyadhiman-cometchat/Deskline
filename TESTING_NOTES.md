# Testing Notes — DeskLine

> How DeskLine is tested: automated backend tests, the seed data that testing and demos rely on, the manual QA checklist, and known gaps. See [DEMO_GUIDE.md](DEMO_GUIDE.md) for the end-to-end walkthrough and [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint contracts.

---

## Automated tests (backend)

- **Framework:** [Vitest](https://vitest.dev) 3.x.
- **Location:** `backend/tests/`.
- **Run:**
  ```bash
  cd backend
  npm test          # vitest run (once)
  npm run test:watch # vitest (watch mode)
  ```

### Current coverage

| Test file | Subject |
|---|---|
| `tests/health.test.ts` | App bootstrap — the Express app factory builds and exports an app |

Step 1 ships a smoke-level test that proves the app wires up. This is intentionally minimal; the sections below list the high-value units that should be covered next.

> **Baseline note:** the wider repo has known pre-existing `tsc`/lint issues and the backend build uses **tsup**, not `tsc` — so a red `tsc` does not mean the app is broken. Treat `npm run build` (tsup) and `npm test` (Vitest) as the authoritative signals, not a repo-wide type-check.

### Recommended next unit tests

Derived from the [SCOPE_OF_WORK.md](SCOPE_OF_WORK.md) testing plan; these are the logic-heavy, high-value targets:

- **Ticket routing** — each sub-type maps to the correct destination: `information` → AI (no assignment), `action`/`conversation` → least-loaded agent in the matching department, `escalation` → supervisor, no-match → unassigned + supervisors notified.
- **Status-transition guard** — only allowed `TicketStatus` transitions succeed; assignment changes are supervisor/admin only.
- **RBAC middleware** — `requireRole` / `requirePermission` allow/deny per the map in `backend/src/config/rbac.ts`.
- **Auth/token** — access-token verification, refresh-token rotation + revocation, inactive-user rejection.
- **Notification funnel** — `createNotification()` writes a notification row + an activity log, and skips push gracefully when no `fcmToken`.
- **Resolution flow** — resolve → confirm closes; resolve → reject reopens; 24h timeout auto-closes.

### Integration / E2E (planned per scope)

- Register → login → `/auth/me` returns the profile; refresh rotates tokens.
- Create `information` ticket → AI auto-reply comment appears + employee notified.
- Create `conversation` ticket → agent assigned + notified.
- Resolve → employee confirms → ticket `closed`.
- (Step 2) Webhook receiver processes `message.sent` / `message.flagged`.

---

## Test data (seed)

`backend/prisma/seed.ts` is **idempotent** — re-running never duplicates rows — which makes it safe to reset a test database repeatedly.

It creates:

| Data | Amount |
|---|---|
| Users | **105** — 5 admin, 10 supervisor, 20 agent, 70 employee (across IT/HR/General) |
| Tickets | **60** — spread across every category, sub-type, priority, status; first 50 assigned, last 10 unassigned |
| Notifications | ~60 (mix of `assignment` / `ticket_update`) |
| Activity logs | ~180 (created / status-updated / notification-sent per ticket) |

All seeded users share the password **`Password123!`** (demo/staging only). Sample accounts:

| Role | Email |
|---|---|
| Admin | `admin1@deskline.local` |
| Supervisor | `supervisor1@deskline.local` |
| Agent | `agent1@deskline.local` |
| Employee | `employee1@deskline.local` |

Reset + reseed a local DB:
```bash
cd backend
npm run prisma:migrate   # ensure schema is current
npm run seed             # idempotent — safe to re-run
```

---

## Manual QA checklist

Reproduce the flows from [DEMO_GUIDE.md](DEMO_GUIDE.md), verifying each acceptance criterion.

### Auth & RBAC
- [ ] Register a new user → lands as `employee`.
- [ ] Login/logout works for all four roles; logout revokes the refresh token.
- [ ] Access token expiry → refresh issues a new pair; the old refresh token is rejected on reuse.
- [ ] Employee cannot reach `/api/admin/*` (403); admin can.
- [ ] Ticket list is correctly scoped per role (own / queue / all).

### Ticket lifecycle
- [ ] `information` ticket → AI auto-reply comment appears; employee notified.
- [ ] `action`/`conversation` ticket → assigned to least-loaded agent in the department; agent notified.
- [ ] `escalation` ticket → goes to a supervisor directly.
- [ ] Agent updates status `open → in_progress → resolved`; employee notified each step.
- [ ] Resolve → employee confirms → `closed`; employee rejects → reopened.
- [ ] Escalate → ownership moves to supervisor; both supervisor and employee notified.
- [ ] Supervisor reassigns a ticket → new agent notified.
- [ ] Comment on a ticket → counterparty notified.

### Notifications
- [ ] In-app notification centre shows new items; unread badge clears on read.
- [ ] With Firebase configured + a registered `fcmToken`, a push arrives on the device.
- [ ] With Firebase unconfigured, notifications still persist (no crash).
- [ ] Admin announcement reaches the targeted role(s).

### Admin dashboard
- [ ] User list loads; filter by role/department/active works.
- [ ] Create / update / deactivate a user.
- [ ] Activity log and notification log load and filter by date/type.
- [ ] Dashboard totals and breakdowns render.

### UI states (web + mobile)
- [ ] Loading, empty, and error states render on list/detail screens.
- [ ] Responsive at 375 / 768 / 1440 px (web).
- [ ] Mobile: iOS simulator + a physical Android device; push tested on a real device.

---

## Known limitations (Step 1)

- Automated coverage is a single bootstrap test; unit/integration suites above are the next work.
- **No rate limiting** on auth endpoints yet (hardening item).
- Push delivery requires a configured Firebase project; without it, notifications persist but aren't pushed.
- AI auto-reply quality is intentionally shallow (proves the flow, not answer quality).
- Email is stored but not verified.

## Step 2 additions (CometChat branch)

The `cometchat-integration` branch adds a real Vitest suite around the integration (`backend/src/modules/cometchat/__tests__/` + an auth integration test), all mocking the CometChat REST client so they run offline:

| Test file | Covers |
|---|---|
| `cometchat-auth.service.test.ts` | `generateToken()` / `ensureUserAndGenerateToken()` — token minting + sync-if-needed |
| `cometchat-sync.service.test.ts` | `syncNewUser`, `batchSyncUsers`, `updateUserTags`, `retryPendingSync` — idempotent sync, 409-as-update |
| `cometchat-lifecycle.service.test.ts` | `endConversation`, `reactivateConversation`, `onTicketStatusChange` — chat lifecycle vs ticket status |
| `cometchat-ai.service.test.ts` | `createAIAgentConversation`, `handleHumanHelpRequest` — AI conversation + human handoff |
| `cometchat.controller.test.ts` | `getAuthTokenController` — `/api/cometchat/auth-token` returns `{ cometchatAuthToken }` |
| `auth/__tests__/auth-cometchat-integration.test.ts` | login/register return `cometchatAuthToken`; **null on CometChat failure (graceful degradation)**; response never leaks REST/Auth keys |

Manual CometChat QA (real-time delivery, presence, typing, moderation flagging → admin queue, webhook events visible in the admin log, calling) is covered in [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) and [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md).

**The key regression check:** re-run the entire manual QA checklist above after integration to confirm existing app workflows (auth, tickets, notifications) still pass — the graceful-degradation design means they should, even if CometChat is down.
