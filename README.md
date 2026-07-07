# DeskLine

> **Internal support ticketing system for small SaaS companies.** Employees raise tickets for IT, HR, or general issues; support agents resolve them; supervisors handle escalations; admins manage users, view logs, and moderate. Ships as a **React web app** and a **Flutter mobile app**, both backed by a single **Express + Prisma + PostgreSQL** API.

This `main` / `production-ready-app` branch is the **Step 1 production-ready application** — a complete, self-contained support platform built **before** CometChat. The **Step 2 CometChat integration is implemented on the `cometchat-integration` branch**; the CometChat docs here describe that real implementation so this branch carries full documentation coverage. See the [CometChat docs](#documentation).

---

## Documentation

| Document | What's in it |
|---|---|
| [SCOPE_OF_WORK.md](SCOPE_OF_WORK.md) | Full requirement / scope of work — use case, roles, permissions, workflows, screens, APIs, acceptance criteria |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Every REST endpoint, auth requirements, request/response shapes |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | Data model, entities, relationships, enums, indexes, migrations |
| [NOTIFICATION_FLOW.md](NOTIFICATION_FLOW.md) | The notification funnel, every trigger, FCM push, the auto-close job |
| [DECISION_LOG.md](DECISION_LOG.md) | Every major technical decision, alternatives considered, and why |
| [TESTING_NOTES.md](TESTING_NOTES.md) | Test setup, how to run, coverage, manual QA checklist |
| [DEMO_GUIDE.md](DEMO_GUIDE.md) | Step-by-step reproducible demo script with seeded credentials |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Staging deployment (Docker Compose → nginx → ALB) |
| [SCHEMA.md](SCHEMA.md) | Authoritative Prisma schema reference |
| [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) | **Step 2** — CometChat integration as built (user sync, group chat, tags/RBAC, AI agent, moderation, calling, push) |
| [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md) | **Step 2** — CometChat webhook endpoint, security, events, admin log |
| [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md) | **Step 2** — which CometChat Skills were used and how |

---

## Repository layout

```
Deskline/
├── backend/                 # Express + Prisma + PostgreSQL API (TypeScript)
│   ├── prisma/              #   schema.prisma, migrations/, seed.ts
│   └── src/
│       ├── config/          #   env, rbac permission map
│       ├── lib/             #   prisma, token, password, firebase, errors
│       ├── middleware/      #   auth (JWT + RBAC), error handler, request logger
│       ├── modules/         #   auth, tickets, users, admin, notifications,
│       │                    #   comments, activity-logs, ai
│       └── routes/          #   health
├── web/                     # React 19 + TypeScript + Vite SPA (+ admin dashboard)
├── mobile_app/              # Flutter 3.x app (Riverpod, GoRouter, Dio)
├── deploy/                  # nginx vhost for staging
├── docker-compose.yml       # Local/dev stack
├── docker-compose.prod.yml  # Staging stack
├── .env.production.example  # Staging env template
└── *.md                     # Documentation (see table above)
```

---

## Tech stack

| Layer | Web | Mobile | Backend |
|---|---|---|---|
| Language | TypeScript | Dart | TypeScript (Node 20+) |
| Framework | React 19 + Vite | Flutter 3.x | Express 5 |
| State | Zustand + TanStack Query | Riverpod | — |
| Routing | React Router | GoRouter | — |
| HTTP | axios | Dio | — |
| Forms/Validation | React Hook Form + Zod | — | Zod |
| UI | Tailwind CSS + shadcn/ui (Radix) | Material | — |
| Auth | JWT (access + refresh) | JWT (secure storage) | JWT + bcrypt |
| Data | — | — | Prisma 7 + PostgreSQL 16 |
| Push | Firebase (web push) | firebase_messaging | firebase-admin (FCM) |
| AI | — | — | Google Gemini (`@google/genai`) |

---

## Quick start (Docker — recommended)

The fastest way to run the entire stack (Postgres + backend + web) with migrations and seed data applied automatically.

```bash
# 1. Clone
git clone <repo-url> deskline && cd deskline

# 2. Create an env file at the repo root
cp .env.production.example .env
#    For local use you can leave GEMINI_API_KEY / FIREBASE_* blank —
#    the AI reply falls back to a mock and push is skipped gracefully.
#    Set POSTGRES_* and generate JWT secrets:
#      openssl rand -hex 64   # JWT_ACCESS_SECRET
#      openssl rand -hex 64   # JWT_REFRESH_SECRET

# 3. Bring up the stack
docker compose up -d --build

# 4. Watch the backend apply migrations + seed on first boot
docker compose logs -f backend
```

- Web: **http://localhost** (port 80)
- API: **http://localhost:4000/api** — health check at `/api/health`
- Postgres: **localhost:5432**

The backend container runs `prisma migrate deploy` → seed → server on start, so a fresh database comes up fully populated with **105 users and 60 tickets**.

---

## Local development (without Docker)

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 16 running locally (or `docker compose up -d db` to run just the database)
- Flutter 3.x (only for the mobile app)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL + JWT secrets
npm run prisma:migrate        # apply migrations (prisma migrate dev)
npm run seed                  # seed 105 users + 60 tickets
npm run dev                   # start API on http://localhost:4000
```

Backend scripts (from `backend/package.json`):

| Script | Purpose |
|---|---|
| `npm run dev` | Start API in watch mode (`tsx watch`) |
| `npm run build` | Bundle with tsup → `dist/server.js` |
| `npm start` | Run the built server |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run prisma:migrate` | Create + apply a dev migration |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Seed the database |

### 2. Web

```bash
cd web
npm install
# Set VITE_API_URL=http://localhost:4000 in a .env for local dev
# (leave empty only when the SPA is served same-origin behind nginx)
npm run dev                   # Vite dev server (default http://localhost:5173)
```

Web scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`.

### 3. Mobile

```bash
cd mobile_app
flutter pub get
flutter run                   # point the API base URL at your backend
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (default `7d`) |
| `CORS_ORIGINS` | Comma-separated allowed browser origins (prod) |
| `GEMINI_API_KEY` | Google Gemini key for AI auto-replies (optional — falls back to mock) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK for FCM push (optional — push skipped if unset) |

### Web (`VITE_*`, baked in at build time)

`VITE_API_URL` (empty = same-origin `/api/*`), `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_VAPID_KEY` (web push).

> **Secrets never reach the client.** The CometChat REST API Key (Step 2) and all Firebase server credentials live in the backend environment only; the browser/app receive only a per-user CometChat auth token minted by the backend. Only the public `COMETCHAT_APP_ID` / `COMETCHAT_REGION` are exposed (as `VITE_COMETCHAT_*`).

See [.env.production.example](.env.production.example) for the full staging template and [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment.

---

## Seeded login credentials

All seeded users share the password **`Password123!`** (demo/staging only — never production).

| Role | Example email | Count |
|---|---|---|
| Admin | `admin1@deskline.local` | 5 |
| Supervisor | `supervisor1@deskline.local` | 10 |
| Agent | `agent1@deskline.local` | 20 |
| Employee | `employee1@deskline.local` | 70 |

**105 users total**, plus 60 tickets spread across every category, sub-type, priority, and status, with matching notifications and activity logs. See [DEMO_GUIDE.md](DEMO_GUIDE.md) for a full walkthrough.

---

## Roles at a glance

| Role | Can |
|---|---|
| **Employee** | Raise tickets, track own tickets, comment, confirm/reject resolution |
| **Agent** | View department queue, claim/update tickets, comment, escalate |
| **Supervisor** | View all tickets, receive escalations, reassign agents, see agent load |
| **Admin** | Manage users, view activity & notification logs, dashboard, announcements |

Full permission matrix in [SCOPE_OF_WORK.md](SCOPE_OF_WORK.md#user-permissions).

---

## Git branches

| Branch | Contents |
|---|---|
| `production-ready-app` | Step 1 — the base production app before CometChat (this state) |
| `cometchat-integration` | Step 2 — CometChat added on top, existing workflows preserved |

The `production-ready-app` branch is the customer's existing production-style application; `cometchat-integration` is the real-world CometChat integration project layered on top.
