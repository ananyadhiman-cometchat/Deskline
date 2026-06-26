# DeskLine — Internal Support Ticketing System

> **Assignment 1 — CometChat Integration Submission**
> Full-stack production-ready application with CometChat real-time communication, moderation, webhooks, and agent chat.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Branches](#repository-branches)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started — Local Development](#getting-started--local-development)
6. [Getting Started — Staging Deployment](#getting-started--staging-deployment)
7. [Seeded Users](#seeded-users)
8. [Documentation Index](#documentation-index)
9. [Environment Variables Reference](#environment-variables-reference)

---

## Project Overview

DeskLine is a lightweight internal support ticketing system built for small SaaS companies. Employees raise tickets for IT, HR, or general issues. Support agents resolve them. Supervisors handle escalations. Admins control users, system settings, and review AI-flagged messages.

**Step 1** delivers a production-ready application with full RBAC, push notifications, admin dashboard, and 100+ seeded users — all without CometChat.

**Step 2** integrates CometChat on the `cometchat-integration` branch: 1:1 chat, group escalation chat, CometChat push notifications, AI moderation, webhooks, voice & video calling, and an AI agent for Information tickets.

---

## Repository Branches

| Branch | Description |
|--------|-------------|
| `production-ready-app` | Step 1 — core application, no CometChat |
| `cometchat-integration` | Step 2 — CometChat fully integrated (current branch) |

> **Important:** The `production-ready-app` branch is frozen after Step 1 approval. All CometChat work lives in `cometchat-integration`.

---

## Tech Stack

### Web Frontend (`/web`)
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| UI State | Zustand |
| Server State | TanStack Query |
| Styling | Tailwind CSS + shadcn/ui |
| Chat UI | CometChat React UI Kit v5 |
| Forms | React Hook Form + Zod |
| Build | Vite |

### Mobile App (`/mobile_app`)
| Layer | Technology |
|-------|-----------|
| Framework | Flutter 3.x (Dart) |
| State Management | Riverpod |
| Navigation | GoRouter |
| Chat UI | CometChat Flutter UI Kit |
| Push Notifications | firebase_messaging (FCM + APNs) |
| HTTP | Dio |

### Backend (`/backend`)
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js + TypeScript |
| Auth | JWT + Refresh Tokens |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| CometChat SDK | @cometchat/chat-sdk-javascript |
| Push | FCM via Firebase Admin SDK |
| Validation | Zod |

---

## Project Structure

```
Deskline/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── modules/            # Feature modules (auth, tickets, users, cometchat, webhooks…)
│   │   ├── middleware/         # Auth, RBAC, error handling
│   │   ├── config/             # Environment, Prisma client
│   │   └── jobs/               # Cron jobs (auto-close tickets)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── tests/
├── web/                        # React SPA
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   ├── pages/              # Route-level pages
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API clients
│   │   └── lib/                # CometChat init, Firebase init
│   └── public/
├── mobile_app/                 # Flutter mobile app
│   ├── lib/
│   │   ├── core/               # Networking, auth, routing
│   │   ├── features/           # Feature screens (tickets, chat, profile…)
│   │   └── shared/             # Services, models, widgets
│   └── ios/ / android/
├── deploy/
│   └── nginx/                  # Host nginx vhost configs
├── docs/                       # All assignment documentation
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_DESIGN.md
│   ├── NOTIFICATION_FLOW.md
│   ├── COMETCHAT_INTEGRATION.md
│   ├── COMETCHAT_SKILLS_USAGE.md
│   ├── COMETCHAT_WEBHOOKS.md
│   ├── DECISION_LOG.md
│   ├── TESTING_NOTES.md
│   └── DEMO_GUIDE.md
├── SCOPE_OF_WORK.md
├── SCHEMA.md
├── DEPLOYMENT.md
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # Staging deployment
├── .env.production.example
└── README.md                   # This file
```

---

## Getting Started — Local Development

### Prerequisites
- Docker & Docker Compose v2
- Node.js 20+ (for local backend/web dev without Docker)
- Flutter 3.x (for mobile app)

### 1. Clone the repository

```bash
git clone <repo-url> deskline
cd deskline
git checkout cometchat-integration   # or production-ready-app for Step 1
```

### 2. Configure environment

```bash
cp .env.production.example .env
# Edit .env — fill in POSTGRES_*, JWT_*, COMETCHAT_*, FIREBASE_*, GROQ_API_KEY
```

### 3. Start the stack

```bash
docker compose up -d --build
```

Services start at:
| Service | URL |
|---------|-----|
| Backend API | http://localhost:4001 |
| Web SPA | http://localhost:8081 |
| PostgreSQL | localhost:5433 |

### 4. Run migrations & seed

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

### 5. Verify

```bash
curl http://localhost:4001/api/health
# → {"status":"ok","service":"DeskLine API"}
```

---

## Getting Started — Staging Deployment

**Live URL:** https://integrateddeskline.cometchat-staging.com

Architecture: `Client → ALB (TLS :443) → EC2 → Docker containers`

Containers are exposed directly to the ALB (no host nginx intermediary):
| Service | Host port | Container port |
|---------|-----------|----------------|
| Backend | 4001 | 4000 |
| Web SPA | 8081 | 80 |
| PostgreSQL | 5433 (loopback) | 5432 |

Full deployment steps: see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Seeded Users

The seed script (`backend/prisma/seed.ts`) creates **100+ realistic users**:

| Role | Count | Login pattern |
|------|-------|---------------|
| Admin | 5 | admin1@deskline.test … admin5@deskline.test |
| Supervisor | 10 | supervisor1@deskline.test … |
| Agent | 20 | agent1@deskline.test … |
| Employee | 65+ | employee1@deskline.test … |

Default password for all seeded users: **`Password123!`**

> Seed data spans all four ticket sub-types (Information, Action, Conversation, Escalation) across IT, HR, and General departments.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [SCOPE_OF_WORK.md](./SCOPE_OF_WORK.md) | Full requirements, workflows, API list, DB entities, acceptance criteria |
| [SCHEMA.md](./SCHEMA.md) | Prisma schema reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Staging server setup guide |
| [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | All REST endpoints with request/response shapes |
| [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) | Entity-relationship design and decisions |
| [docs/NOTIFICATION_FLOW.md](./docs/NOTIFICATION_FLOW.md) | All 18 notification triggers, recipients, and delivery paths |
| [docs/COMETCHAT_INTEGRATION.md](./docs/COMETCHAT_INTEGRATION.md) | How CometChat is integrated — user sync, chat, calling, push |
| [docs/COMETCHAT_SKILLS_USAGE.md](./docs/COMETCHAT_SKILLS_USAGE.md) | Which CometChat Skills were used and how |
| [docs/COMETCHAT_WEBHOOKS.md](./docs/COMETCHAT_WEBHOOKS.md) | Webhook endpoint, events, processing, admin log |
| [docs/DECISION_LOG.md](./docs/DECISION_LOG.md) | Step 1 and Step 2 key decisions with alternates and rationale |
| [docs/TESTING_NOTES.md](./docs/TESTING_NOTES.md) | Test coverage, commands, and QA notes |
| [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) | Step-by-step demo script for evaluators |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | ✅ | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `POSTGRES_DB` | ✅ | PostgreSQL database name |
| `DATABASE_URL` | ✅ | Full Prisma connection string |
| `JWT_ACCESS_SECRET` | ✅ | 64-byte hex secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | 64-byte hex secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | ✅ | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | e.g. `7d` |
| `GROQ_API_KEY` | ✅ | Groq LLM key for AI agent replies |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID (FCM) |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase Admin SDK service account |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase Admin SDK private key |
| `COMETCHAT_APP_ID` | ✅ (Step 2) | CometChat application ID |
| `COMETCHAT_REGION` | ✅ (Step 2) | CometChat region (e.g. `in`, `us`) |
| `COMETCHAT_REST_API_KEY` | ✅ (Step 2) | CometChat REST API key |
| `COMETCHAT_WEBHOOK_SECRET` | Step 2 | Shared secret for webhook verification |
| `COMETCHAT_AI_AGENT_UID` | Step 2 | UID of the CometChat AI bot user |
| `VITE_COMETCHAT_APP_ID` | Step 2 | CometChat App ID baked into web bundle |
| `VITE_COMETCHAT_REGION` | Step 2 | CometChat region baked into web bundle |
| `VITE_FIREBASE_*` | ✅ | Firebase web client config (baked at build time) |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed browser origins |
