# Decision Log

> Every major implementation choice for DeskLine, the alternate options considered, and why the selected option was chosen. Step 1 covers the production-ready application built **before** CometChat. Step 2 covers the CometChat integration.
>
> Each entry follows the assignment's Decision Log Template: **Selected Approach → Alternate Options Considered → Why This Was Chosen → Trade-offs → Limitations/Assumptions → Future Improvements.**

---

# Step 1 — Production-Ready Application

## Decision 1: Application Use Case Selection

### Selected Approach
An **internal support ticketing system** ("DeskLine") for small SaaS companies. Employees raise tickets for IT, HR, or general issues; agents resolve them; supervisors handle escalations; admins manage the platform.

### Alternate Options Considered
1. Learning management system
2. Internal employee portal
3. Project collaboration tool
4. Marketplace app

### Why This Was Chosen
A support platform maps cleanly onto every capability the assignment wants to demonstrate later: user-to-agent chat (Conversation tickets), role-based access (four distinct roles), notifications (assignment/escalation/status), moderation (chat between employees and agents), agents (the core role), and webhooks (chat events driving ticket state). The ticket lifecycle gives a natural, testable workflow that a chat layer slots into without being contrived.

### Trade-offs
Requires more up-front role and permission modelling than a single-actor CRUD app, but that investment is exactly what the assignment rewards (RBAC, agent routing, escalation ownership).

### Limitations or Assumptions
SLA timers, ticket analytics beyond basic counts, and file attachments are out of scope for Step 1.

### Future Improvements
AI-based ticket routing, SLA tracking, CSAT surveys, and richer agent-performance analytics.

---

## Decision 2: Frontend Framework (Web)

### Selected Approach
**React 18/19 + TypeScript + Vite**, with React Router, Zustand for UI/auth state, TanStack Query for server state, Tailwind CSS + shadcn/ui (Radix primitives) for UI, and React Hook Form + Zod for forms.

### Alternate Options Considered
1. Next.js (SSR/App Router)
2. Vue 3 + Pinia
3. Angular
4. Plain React with Redux Toolkit

### Why This Was Chosen
- **React + Vite** gives the fastest dev loop and a plain SPA that is trivial to containerize behind nginx — this is an authenticated internal dashboard, so SSR/SEO benefits of Next.js are irrelevant.
- **CometChat ships a first-class React UI Kit v5**, so React de-risks Step 2.
- **TanStack Query + Zustand** split server cache from client state cleanly, avoiding Redux boilerplate.
- **Zod schemas are shared in spirit with the backend**, keeping validation contracts consistent across the stack.

### Trade-offs
No built-in SSR or file-based routing; we hand-roll routing and code-splitting. Acceptable for an internal tool.

### Limitations or Assumptions
Web is the primary client; the SPA is same-origin with the API in production (`VITE_API_URL` empty → `/api/*` proxied by nginx).

### Future Improvements
Route-level code splitting and a React Compiler pass once it stabilizes.

---

## Decision 3: Mobile Framework

### Selected Approach
**Flutter 3.x (Dart)** with Riverpod (state), GoRouter (navigation), Dio (HTTP), flutter_secure_storage (tokens), and firebase_messaging (push).

### Alternate Options Considered
1. React Native (share more with web)
2. Native Android (Kotlin) + iOS (Swift)
3. Progressive Web App only

### Why This Was Chosen
A single Dart codebase ships both iOS and Android from one team, and **CometChat provides a Flutter UI Kit and SDK**, matching the Step 2 plan. Riverpod + GoRouter is the modern, testable Flutter stack; Dio gives interceptor-based JWT refresh that mirrors the web axios client.

### Trade-offs
Less code reuse with the React web app than React Native would give, but stronger native performance and a better-supported CometChat mobile kit.

### Limitations or Assumptions
Mobile consumes the same REST API as web; no mobile-only backend.

### Future Improvements
Offline ticket caching and background sync.

---

## Decision 4: Backend Framework

### Selected Approach
**Node.js 20 + Express.js + TypeScript**, organized into feature **modules** (`auth`, `tickets`, `users`, `admin`, `notifications`, `comments`, `activity-logs`, `ai`), each with its own router/controller/service.

### Alternate Options Considered
1. NestJS (opinionated DI framework)
2. Fastify
3. Django / FastAPI (Python)
4. Spring Boot (Java)

### Why This Was Chosen
- **One language across the stack** (TypeScript on web, backend, and shared types) lowers context-switching cost.
- **Express is minimal and universally understood**, and a clear module-per-feature layout gives most of NestJS's structure without the framework overhead.
- **CometChat's server-side helpers and REST examples are JavaScript-first**, easing Step 2.

### Trade-offs
Express gives less out-of-the-box structure than NestJS (no built-in DI or decorators); we compensate with a disciplined module convention and Zod-validated boundaries.

### Limitations or Assumptions
API-first: the same contracts serve both web and mobile.

### Future Improvements
Extract shared request/response types into a published package consumed by web and mobile.

---

## Decision 5: Database & ORM

### Selected Approach
**PostgreSQL 16 + Prisma ORM**, single relational schema with UUID primary keys and `snake_case` column mapping.

### Alternate Options Considered
1. MongoDB + Mongoose
2. PostgreSQL + raw SQL / Knex
3. PostgreSQL + TypeORM
4. MySQL + Prisma

### Why This Was Chosen
The domain is **highly relational** (users → tickets → comments → notifications → activity logs with foreign keys and role scoping), which fits Postgres far better than a document store. **Prisma** gives type-safe queries, a declarative schema, first-class migrations, and generated types that flow into the TypeScript API. `JSONB` on `activity_logs.metadata` covers the one place we need schemaless flexibility.

### Trade-offs
Prisma's generated client adds a build step and can be less flexible than raw SQL for exotic queries, but hot paths are covered with explicit `@@index` directives (ticket queue, notification bell, activity drill-down).

### Limitations or Assumptions
Single Postgres instance for Step 1; connection pooling handled by the driver.

### Future Improvements
Read replicas and a PgBouncer pool if load grows; partitioning `activity_logs` by time.

---

## Decision 6: Authentication & Authorization

### Selected Approach
**JWT access tokens (short-lived, 15m) + rotating refresh tokens (7d, hashed in the `refresh_tokens` table)**. Passwords hashed with bcrypt. Role-based access control enforced by middleware that reads the authenticated user's `role` and gates each route.

### Alternate Options Considered
1. Server-side sessions + cookies
2. Auth0 / Clerk / Firebase Auth (managed)
3. Access-token-only JWT (no refresh)
4. OAuth2 social login

### Why This Was Chosen
- **Stateless JWT access tokens** scale across web and mobile without shared session storage.
- **Refresh-token rotation with hashed storage** allows revocation and detects token reuse — the security posture the assignment's "secure password handling" and "authenticated API access" criteria expect.
- **Self-hosted auth** keeps user identity in our own `users` table, which is a prerequisite for the Step 2 CometChat UID mapping (every app user ID becomes a CometChat UID). A managed provider would have complicated that mapping.

### Trade-offs
We own token lifecycle, rotation, and revocation logic instead of delegating it. More code, but full control and no per-MAU vendor cost.

### Limitations or Assumptions
Email verification is out of scope; email is stored but not verified. Role is assigned by an admin after self-registration.

### Future Improvements
Optional 2FA, device-scoped refresh tokens, and account lockout tuning (the `last_failed_login_at` field already backs brute-force detection).

---

## Decision 7: Role / Permission Model

### Selected Approach
Four roles — **employee, agent, supervisor, admin** — plus a `department` (IT/HR/General) that scopes agents into pools. A single permissions matrix (see [SCOPE_OF_WORK.md](SCOPE_OF_WORK.md)) drives route-level RBAC and data scoping (employees see own tickets, agents see their queue, supervisors/admins see all).

### Alternate Options Considered
1. Fine-grained per-permission ACL system
2. Two roles only (user/admin)
3. Attribute-based access control (ABAC)

### Why This Was Chosen
Four coarse roles map exactly to real support-org structure and to the assignment's example role set, while `department` adds just enough dimensionality for realistic ticket routing without the complexity of a full ACL engine. It also maps 1:1 onto **CometChat tags** in Step 2 (role + department become tags for RBAC on chat).

### Trade-offs
Coarse roles can't express one-off permission grants; adding a genuinely new capability means touching the matrix. Acceptable for the scope.

### Limitations or Assumptions
A user has exactly one role and one department.

### Future Improvements
A permissions table for delegated/temporary grants if the org model grows.

---

## Decision 8: Push Notifications (App-Originated)

### Selected Approach
A single backend `createNotification()` funnel that (1) writes a `notifications` row, (2) writes an `activity_logs` entry, and (3) fires an **FCM** push via the Firebase Admin SDK when the recipient has a stored `fcm_token`. Web and mobile both register FCM tokens.

### Alternate Options Considered
1. WebSockets / Server-Sent Events for in-app only
2. OneSignal / Pusher (managed push)
3. Separate push paths for web vs mobile (web push API + APNs directly)

### Why This Was Chosen
- **FCM covers both web and mobile** from one server integration, so the same funnel serves every client.
- **A single choke-point function** guarantees every notification is persisted (for the notification centre and admin log) *and* delivered, and makes it trivial to prove in Step 2 that app notifications keep working after CometChat push is added.
- Deliberately decoupling "persist" from "deliver" means the in-app notification centre still works even when a device has no token.

### Trade-offs
FCM web push needs a VAPID key and service worker; APNs is fronted by FCM rather than called directly. Slightly more setup, but one code path.

### Limitations or Assumptions
Push requires a configured Firebase project; without `fcm_token`, notifications are persisted but not pushed. Delivery is best-effort.

### Future Improvements
Per-user notification preferences and digest batching.

---

## Decision 9: AI Auto-Reply for Information Tickets

### Selected Approach
`information` sub-type tickets receive an automated first response. Step 1 uses a **simulated/LLM-backed auto-reply** (Gemini via `GEMINI_API_KEY` when configured, falling back to a canned response), posted as an AI comment on the ticket, with no human agent assigned unless the employee requests human help.

### Alternate Options Considered
1. No AI at all — route everything to humans
2. Full CometChat AgentKit from day one
3. A static FAQ lookup

### Why This Was Chosen
It demonstrates the AI-vs-human routing decision the domain calls for while keeping Step 1 self-contained and deterministic for demos. Real CometChat AI Agent integration is explicitly a **Step 2** concern, so Step 1 keeps the seam (`request-human-help`) that lets an unsatisfied employee escalate to a person.

### Trade-offs
The Step 1 AI is intentionally shallow; it proves the flow, not production answer quality.

### Limitations or Assumptions
If `GEMINI_API_KEY` is unset, the reply is a fixed template so demos never depend on an external call.

### Future Improvements
Swap the simulated reply for CometChat AI Agent / AgentKit in Step 2 (see [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md)).

---

## Decision 10: Admin Dashboard Structure

### Selected Approach
A dedicated admin area inside the web SPA (not a separate app), backed by `/api/admin/*` routes: user management (create/update/deactivate/assign role), ticket analytics, notification logs, and activity logs, with search/filter.

### Alternate Options Considered
1. A separate standalone admin application
2. A third-party admin panel (Retool / Forest Admin)
3. Direct DB access / SQL for admins

### Why This Was Chosen
Admins share the same auth, design system, and API as every other role, so folding the dashboard into the SPA (gated by the `admin` role) avoids a second deploy target and a second auth integration. The assignment's admin requirements (view/manage users, view activities and notification logs, usage summary, search/filter) are all standard CRUD + list views that reuse existing components.

### Trade-offs
The SPA bundle carries admin-only code for all users (mitigated by lazy-loading admin routes).

### Limitations or Assumptions
Moderation queue and webhook event log are placeholders in Step 1 and become live in Step 2.

### Future Improvements
Role-scoped bundle splitting and exportable reports.

---

## Decision 11: Deployment & Environment Setup

### Selected Approach
**Docker Compose** for both local dev (`docker-compose.yml`) and staging (`docker-compose.prod.yml`): Postgres, backend (Express + Prisma), and web (nginx-served SPA) containers. Staging sits behind **ALB (TLS) → host nginx → containers**. Config is entirely environment-driven; secrets live only in `.env` (never committed, never sent to the client).

### Alternate Options Considered
1. Managed PaaS (Render / Railway / Heroku)
2. Kubernetes
3. Bare-metal / PM2 without containers
4. Serverless (Lambda + RDS)

### Why This Was Chosen
Compose gives one reproducible stack that runs identically on a laptop and a `t3.small` EC2 box, which is right-sized for a staging demo. Kubernetes is overkill at this scale; a PaaS would hide the infra the assignment wants demonstrated. The backend container runs `prisma migrate deploy` then an idempotent seed on start, so a fresh environment is one `up` away. Full details in [DEPLOYMENT.md](DEPLOYMENT.md).

### Trade-offs
Single-host Compose has no built-in horizontal scaling or rolling deploys; acceptable for staging/demo.

### Limitations or Assumptions
`VITE_*` values are baked into the web bundle at build time, so changing them needs a rebuild. Same-origin `/api/*` in prod avoids CORS.

### Future Improvements
Move to ECS/Fargate or K8s with rolling deploys and a managed RDS instance for production.

---

## Decision 12: Seed Data Structure

### Selected Approach
An **idempotent seed script** that creates 100+ users spread across all roles and departments (admins, supervisors, agents, employees), plus a realistic spread of tickets across all four sub-types, categories, statuses, and priorities, with supporting comments, notifications, and activity logs. All seeded users share a known demo password.

### Alternate Options Considered
1. Random one-off seed (non-deterministic)
2. Manual fixture creation
3. Faker with no fixed accounts

### Why This Was Chosen
The assignment requires 100+ users with varied roles, profiles, and activity history that are "realistic enough to support demos, testing, and CometChat integration in Step 2." An idempotent script means re-running never duplicates rows, and fixed demo credentials make the demo script reproducible. Spreading tickets across every enum value ensures every screen (queues, filters, dashboards, timelines) has data.

### Trade-offs
Fixed demo passwords are insecure by design — for demo/staging only, never production.

### Limitations or Assumptions
Seeded `cometchat_uid` is populated in Step 2 during the bulk user sync.

### Future Improvements
Parameterize seed volume and add seeded chat transcripts once CometChat is wired in.

---

# Step 2 — CometChat Integration

> These decisions capture the **planned** CometChat integration approach per [SCOPE_OF_WORK.md](SCOPE_OF_WORK.md) and are implemented on the `cometchat-integration` branch. See [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md), [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md), and [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md).

## Decision 13: CometChat Integration Approach & UID Strategy

### Selected Approach
Integrate CometChat as an **additive layer** on top of the existing app. Every app user's **CometChat UID equals their app user ID** (the `users.id` UUID), stored in `users.cometchat_uid`. Auth tokens are generated **server-side only** via `/api/cometchat/auth-token`; the App ID, Region, and Auth Key never reach the client.

### Alternate Options Considered
1. Separate random CometChat UIDs with a mapping table
2. Email-as-UID
3. Client-side auth-key usage (fast but insecure)

### Why This Was Chosen
UID = app user ID means **no mapping table and no identity drift** — any place the app knows a user, it knows their CometChat identity. Server-side token generation keeps the Auth Key secret, satisfying the "never exposed to the client" acceptance criterion. Users never see a separate CometChat login.

### Trade-offs
UIDs are UUIDs rather than human-readable, but that never surfaces in the UI.

### Limitations / Assumptions
CometChat App ID/Region/Auth Key are server env vars only.

### Future Improvements
Cache issued tokens with TTL to cut round-trips.

---

## Decision 14: User Sync Strategy

### Selected Approach
**Bulk-sync existing seeded users** to CometChat via a one-time script/Data Import, and **create-or-sync on registration** for new users inside the auth flow. Profile updates and deactivations propagate to CometChat.

### Alternate Options Considered
1. Lazy sync on first chat
2. Webhook-driven sync only
3. Manual CometChat dashboard entry

### Why This Was Chosen
Seeded users must be chat-ready immediately for demos, so a bulk import handles the back-catalogue while an inline hook on `register` handles the steady state. This guarantees identity consistency without a separate CometChat signup.

### Trade-offs
Two code paths (bulk + inline), but each is simple and idempotent.

### Limitations / Assumptions
Deactivated app users are deactivated in CometChat; deletion is soft.

---

## Decision 15: Tags & RBAC in CometChat

### Selected Approach
Tag every synced user by **role** and **department**. Use tags to restrict who can talk to whom (employees cannot DM other employees; agents/supervisors/admins have broader reach), and to drive group membership for escalations.

### Alternate Options Considered
1. No tags — open messaging
2. Groups-only permissioning
3. External policy service

### Why This Was Chosen
Tags mirror the app's existing role/department model exactly, so the chat layer enforces the same real-world permissions the API already enforces, with documentation-friendly, filterable metadata.

### Trade-offs
Tag updates must track role/department changes (handled in the profile-update sync).

---

## Decision 16: 1:1 → Group Chat & Agent Flow

### Selected Approach
A ticket chat **starts 1:1** (employee ↔ agent) when an agent claims a Conversation sub-type ticket. On escalation, the supervisor is **added to the existing conversation to form a 3-way group, preserving history** (via the Data Import/group migration path). Agent inbox surfaces active conversations with availability.

### Alternate Options Considered
1. Always-group from the start
2. New separate group on escalation (loses history)
3. Per-message forwarding

### Why This Was Chosen
Most ticket chats never escalate, so starting 1:1 keeps them clean; migrating to a group **with history intact** on escalation matches the escalation-ownership rule without losing context. See the related note in project memory on the 1:1 → group transition.

### Trade-offs
The 1:1→group migration is the trickiest part of the integration; it's isolated behind the escalation handler.

---

## Decision 17: CometChat Push, Moderation & Webhooks

### Selected Approach
- **Push:** CometChat push (message/call alerts) coexists with the existing FCM app-notification funnel; notification handling distinguishes app events from CometChat events.
- **Moderation:** CometChat AI Moderation auto-flags profanity/images; flagged messages surface only in the Admin moderation queue.
- **Webhooks:** A secured `/webhooks/cometchat` endpoint logs events to `webhook_event_logs` and reacts — `message.sent` → activity log, `conversation.ended` → mark ticket resolved, `message.flagged` → notify admin.

### Alternate Options Considered
1. Replacing app push with CometChat push entirely (rejected — must keep app notifications working)
2. A human-moderator role (replaced by AI Moderation)
3. Polling CometChat instead of webhooks

### Why This Was Chosen
This keeps the assignment's central constraint — **existing workflows must keep working** — front and centre: CometChat is added alongside, not on top of, the app's own notifications. Webhooks let chat events drive ticket state server-side, which is the real-world integration the assignment asks to demonstrate.

### Trade-offs
Two notification systems coexist; the code path is clearly labelled by source to avoid confusion.

### Limitations / Assumptions
At least four webhook events processed and visible in the admin log; flagged messages appear in the queue within ~10s.

### Future Improvements
Signed-webhook verification hardening and replay protection.
