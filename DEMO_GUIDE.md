# Demo Guide — DeskLine

> A reproducible, step-by-step demo of the DeskLine platform. Phase 1 covers the **Step 1 production-ready app** (this branch). Phases 2–3 cover the **Step 2 CometChat integration** (`cometchat-integration` branch). Estimated total time: **20–25 minutes**.

---

## Before you start

1. Bring up the stack (see [README.md](README.md)):
   ```bash
   docker compose up -d --build
   docker compose logs -f backend   # wait for migrations + seed to finish
   ```
2. Open the web app at **http://localhost** (or your staging URL).
3. Have **two browser windows** ready (e.g. one normal, one incognito) so you can be logged in as two roles at once.

### Seeded credentials

Password for **all** seeded users: **`Password123!`**

| Role | Email | Use in demo as |
|---|---|---|
| Admin | `admin1@deskline.local` | Platform operator |
| Supervisor | `supervisor1@deskline.local` | Escalation owner |
| Agent | `agent1@deskline.local` | Support agent |
| Employee | `employee1@deskline.local` | Ticket raiser |

Seed volume: **105 users** (5 admin / 10 supervisor / 20 agent / 70 employee) and **60 tickets** across every category, sub-type, priority, and status — so every screen has data.

---

## Phase 1 — Core app (Step 1)

### 1. Admin logs in and reviews the system
- Log in as `admin1@deskline.local`.
- Open the **Admin Dashboard** — show totals (users, tickets, resolved today) and the breakdowns by role, status, department, and priority.
- Open **User Management** — 105 seeded users; filter by role/department. Show create / update / **deactivate** and role assignment.
- Open the **Activity Log** and **Notification Log** — filter by date/type to show the audit trail.

### 2. Employee raises an Information ticket → instant AI reply
- In the second window, log in as `employee1@deskline.local`.
- **Raise Ticket** → sub-type **Information** (e.g. "How do I reset my VPN password?").
- Open the ticket: an **AI auto-reply comment** appears immediately (Gemini, or a labelled mock if no `GEMINI_API_KEY`), and the employee receives a `ticket_update` notification. No human is assigned.
- Optionally click **Request human help** to route it to an agent.

### 3. Employee raises a Conversation ticket → agent notified
- Raise another ticket, sub-type **Conversation** (e.g. "Need to discuss my laptop replacement options").
- It's routed to the least-loaded agent in the matching department; that **agent receives an `assignment` notification** (push, if Firebase is configured).

### 4. Agent works the ticket
- Log in (or switch) to `agent1@deskline.local`.
- Open the **Agent Inbox** → claim/open the Conversation ticket.
- Move status **Open → In Progress** — the **employee is notified** of the status change.
- Add a **comment** — the employee is notified of the reply (and vice-versa).

### 5. Escalation
- From the ticket, the agent clicks **Escalate**.
- Ownership transfers to a **supervisor**; both the supervisor (`escalation`) and the employee (`ticket_update`) are notified.
- Log in as `supervisor1@deskline.local` → the ticket appears in the **Escalation Queue**.

### 6. Supervisor reassigns
- As supervisor, open **Agent Load** to see each agent's open-ticket count.
- Reassign an **Action** ticket to a different agent → the new agent receives an `assignment` notification.

### 7. Resolution confirmation
- As the agent, mark a ticket **Resolved** → the employee gets a **confirmation request**.
- As the employee, **Confirm** → ticket becomes **Closed** (both parties notified). Or **Reject** → ticket reopens for the agent.
- (Automated) Tickets resolved but unconfirmed for **24 hours** are auto-closed by the hourly job.

### 8. Admin announcement + notifications recap
- As admin, send an **Announcement** to a role (e.g. all agents) → recipients receive an `announcement` notification.
- Show the **Notification Centre** on a user account: in-app history with unread badges.

> **Key Step 1 point:** all of the above notifications are **app-originated** (persisted, audited, and pushed via FCM). Step 2 must prove these keep working after CometChat push is added.

---

## Phase 2 — CometChat communication (Step 2)

> Runs on the `cometchat-integration` branch. See [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md).

9. Agent claims a **Conversation** ticket → a **1:1 CometChat chat auto-opens** on the ticket page.
10. Employee and agent **chat in real time** (two windows side by side) — live delivery, **typing indicator**, and **online/offline presence**, no refresh.
11. Agent **escalates** → the supervisor is added to the existing conversation, forming a **3-way group chat with history preserved**.
12. Employee sends a **banned word** → **AI Moderation** flags/blocks it.
13. Admin reviews the flagged message in the **Moderation Queue** and dismisses it.
14. Show **CometChat push** (message/call alert) arriving alongside the existing app notifications — proving both coexist.

---

## Phase 3 — Webhooks & admin visibility (Step 2)

> See [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md).

15. A ticket chat ends → the **`conversation.ended`** webhook fires → the ticket is auto-marked **Resolved**.
16. Admin opens the **Webhook Event Log** → the live events from the demo (`message.sent`, `message.flagged`, `conversation.ended`, …) are visible with status.
17. Admin opens the **Moderation Log** → the flagged message record with the action taken.

---

## Wrap-up talking points

- **What was built before CometChat** — full ticketing platform: auth + RBAC, four roles, ticket routing, resolution flow, admin dashboard, app push notifications, 105 seeded users.
- **What changed after CometChat** — real-time 1:1 and group chat, presence/typing, agent chat, AI moderation, and webhook-driven ticket updates — **added without breaking existing workflows**.
- **How CometChat Skills were used** — see [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md).
- **Key decisions & alternatives** — see [DECISION_LOG.md](DECISION_LOG.md).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login fails for seeded users | Confirm the seed ran (`docker compose logs backend`); password is `Password123!` |
| No AI reply on Information tickets | `GEMINI_API_KEY` unset → a labelled **mock** reply is expected; set the key for live answers |
| No push notification | Firebase env vars unset, or no `fcmToken` registered — notifications still appear **in-app** |
| Empty dashboards | Database wasn't seeded — run `npm run seed` in `backend/` |
| Web can't reach API (local dev) | Set `VITE_API_URL=http://localhost:4000`; in prod leave it empty for same-origin |
