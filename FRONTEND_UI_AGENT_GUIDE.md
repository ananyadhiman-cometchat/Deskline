# DeskLine Frontend UI Agent Guide
## DISCLAIMER ALWAYS FOLLOW->
c:\Users\Admin\dev\Deskline\web
Changes will only be made in the c:\Users\Admin\dev\Deskline\web
Any changes made outside need explicit confirmation from me and need to be reported properly 
## Purpose
This document helps a frontend-focused AI agentbuild UI screens that align with the existing backend contracts and remain compatible with future integration.

---

# Project Status

Backend Step 1 is largely complete.

Implement only Step 1 UI features.

Do NOT implement:
- CometChat UI
- Webhook event log screens
- Moderation queue
- CometChat authentication
- Voice/video calling

Those belong to Step 2.

---

# User Roles

## Employee
Can:
- Register
- Login
- Create tickets
- View own tickets
- View ticket details
- View notifications
- Edit profile

## Agent
Can:
- View assigned tickets
- Update ticket status
- Escalate tickets
- View notifications
- Edit profile

## Supervisor
Can:
- View all tickets
- View escalation queue
- Reassign tickets
- Update ticket status
- View agent workload

## Admin
Can:
- Manage users
- View activity logs
- View notification logs
- View ticket analytics

---

# Authentication Model

## Login Flow

Backend returns:
- Access token
- Refresh token
- User profile

Frontend requirements:
- Store access token in Zustand memory store
- Refresh token is expected to be handled securely
- Retry once after 401 using refresh endpoint
- Logout if refresh fails

Suggested auth store:

```ts
{
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
```

---

# Core Domain Models

## User

```ts
interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'agent' | 'supervisor' | 'admin';
  department: 'IT' | 'HR' | 'General';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Ticket

```ts
interface Ticket {
  id: string;
  title: string;
  description: string;
  category: 'IT' | 'HR' | 'General';
  subType: 'information' | 'action' | 'conversation' | 'escalation';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  employeeId: string;
  agentId?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Notification

```ts
interface Notification {
  id: string;
  userId: string;
  type:
    | 'ticket_update'
    | 'assignment'
    | 'escalation'
    | 'announcement';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
```

## Activity Log

```ts
interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
```

---

# API Response Convention

## Single Entity

```json
{
  "data": {}
}
```

## List Response

```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

## Error Shape

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket with ID xyz does not exist"
  }
}
```

Frontend should build a centralized API error handler around this structure.

---

# Ticket Status Lifecycle

Display status visually as a timeline.

Valid transitions:

```text
open
 └─> in_progress
       ├─> resolved
       └─> escalated
             └─> resolved
                   └─> closed
```

Avoid exposing invalid actions in the UI.

---

# Ticket Sub-Type Behaviour

## information

UI Requirements:
- Show AI reply panel
- No chat UI
- May remain unassigned

## action

UI Requirements:
- Task-oriented ticket
- No chat UI

## conversation

Step 1:
- No chat yet
- Show placeholder section indicating communication features coming later

Step 2:
- Chat panel will appear

## escalation

UI Requirements:
- Highlight urgency
- Supervisor-focused workflow

---

# Backend Endpoints Relevant To UI

## Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

## Tickets

```text
POST   /api/tickets
GET    /api/tickets
GET    /api/tickets/:id
PATCH  /api/tickets/:id
POST   /api/tickets/:id/escalate
```

## Notifications

```text
GET  /api/notifications
```

## Admin

```text
GET   /api/admin/users
POST  /api/admin/users
PATCH /api/admin/users/:id
PATCH /api/admin/users/:id/deactivate
GET   /api/admin/activity-logs
GET   /api/admin/notification-logs
```

---

# Screen Requirements

## Login
- Email
- Password
- Remember loading/error states

## Register
- Name
- Email
- Password
- Department

Role should not be selectable.
Default role is employee.

## Employee Dashboard

Widgets:
- Active tickets
- Recent tickets
- Notification badge
- Raise ticket CTA

## Raise Ticket

Fields:
- Title
- Description
- Category
- Sub-type
- Priority

Validation must match backend.

## Ticket Detail

Display:
- Ticket metadata
- Status timeline
- Assigned agent
- Activity history

For information subtype:
- Show AI response area

## Notification Centre

Display:
- Read/unread states
- Group by date

## Agent Inbox

Filters:
- Status
- Sub-type

Display:
- Assigned tickets only

## Supervisor Ticket View

Display:
- All tickets
- Escalation queue tab
- Reassign controls

## Agent Load View

Table columns:
- Agent
- Department
- Open tickets
- Resolved tickets

## Admin Dashboard

Modules:
- User management
- Activity logs
- Notification logs
- Ticket metrics

---

# State Management Rules

Use Zustand only for:
- Auth state
- Access token
- Sidebar state
- Modal state

Use TanStack Query for:
- Users
- Tickets
- Notifications
- Activity logs
- Analytics

Never duplicate server data inside Zustand.

---

# Recommended Frontend Architecture

```text
src/
 ├─ pages/
 ├─ components/
 ├─ hooks/
 ├─ services/
 │   └─ api/
 ├─ store/
 ├─ types/
 ├─ routes/
 └─ layouts/
```

---

# Future Compatibility Notes

Prepare UI boundaries for Step 2:

Conversation Ticket Detail:

```text
Ticket Information
------------------
Activity Timeline
------------------
Chat Area (future)
```

Admin Area:

Reserve navigation placeholders for:
- Moderation Queue
- Webhook Event Log

Do not implement functionality yet.

---

# Important Integration Assumptions

- IDs are UUID strings.
- Dates are ISO strings.
- Backend uses camelCase JSON.
- Pagination metadata always comes through `meta`.
- Role-based rendering is mandatory.
- Unauthorized actions should be hidden from UI.
- Backend remains source of truth for permissions.
- All mutations may generate notifications and activity logs.

This guide should be treated as the frontend contract unless backend endpoints are updated.

# UI/UX Design Brief — Valorant-Inspired Professional SaaS Website

## Core Objective

Design a modern B2B SaaS website that borrows the visual language of Valorant and Riot Games while remaining suitable for enterprise customers.

The final result should feel:

* Precise
* Structured
* Confident
* Tactical
* Futuristic
* Minimalist
* Reliable
* High-performance

It should NOT feel:

* Like a gaming website
* Cyberpunk
* Neon
* Playful
* Cartoonish
* Startup-generic
* Glassmorphic
* Soft or rounded

Think:

> Enterprise software designed by an industrial design team.

---

# Visual Personality

The interface should communicate:

* Operational excellence
* Reliability
* Monitoring
* Control
* Precision
* Accountability

The feeling should be similar to:

* Mission control software
* Tactical command interfaces
* Enterprise monitoring dashboards
* High-performance infrastructure products

The design language should feel engineered rather than decorated.

Every element should appear intentional.

---

# Design Philosophy

The website should be built around the following principles:

### Sharp over soft

Prefer:

* Straight edges
* Hard lines
* Geometric shapes

Avoid:

* Pill buttons
* Blob shapes
* Organic curves
* Excessive rounding

---

### Structure over decoration

Use:

* Grids
* Alignment
* Borders
* Layout hierarchy

Avoid:

* Random gradients
* Floating shapes
* Decorative backgrounds

The layout itself should create visual interest.

---

### Contrast over color

Use color sparingly.

Most emphasis should come from:

* Typography
* Scale
* Positioning
* Whitespace
* Borders

Red should be reserved for moments of importance.

---

# Color System

## Primary Brand Red

```css
#FF4655
```

Usage:

* Primary CTA
* Active states
* Section indicators
* Important highlights
* Key metrics

Never use red as large backgrounds.

---

## Dark Navy

```css
#0F1923
```

Usage:

* Main headings
* Navigation
* Primary text

This should replace pure black.

---

## Background

```css
#FFFFFF
```

Primary background.

---

## Secondary Background

```css
#F7F7F7
```

Used for alternating sections.

---

## Border

```css
#E5E7EB
```

The design should rely heavily on borders.

---

## Muted Text

```css
#6B7280
```

For descriptions and metadata.

---

# Color Distribution

The overall website should approximately follow:

```text
75% White
15% Dark Navy
8% Gray
2% Red
```

Red should feel intentional and powerful because it is rare.

If red appears everywhere, the website becomes gaming-oriented.

---

# Typography

## Hero Headlines

Font recommendations:

* Bebas Neue
* Oswald
* Inter Tight
* Geist

Style:

```css
font-weight: 800;
letter-spacing: -0.04em;
line-height: 0.95;
text-transform: uppercase;
```

Examples:

```text
CLOSE EVERY TICKET LOOP

SUPPORT WITHOUT CHAOS

OPERATIONS MADE ACCOUNTABLE
```

---

## Section Headlines

```css
font-size: clamp(36px,5vw,64px);
font-weight: 700;
line-height: 1;
```

---

## Body Text

```css
font-family: Inter;
font-weight: 400;
line-height: 1.7;
```

Maximum readability.

---

# Layout System

## Content Width

```css
max-width: 1280px;
```

---

## Grid

Use a strict grid.

```css
12-column layout
```

Every section should align perfectly.

No floating content.

---

## Spacing

Generous spacing.

```css
Section padding:
120px 0

Component spacing:
24px
32px
48px
```

The design should breathe.

---

# Navigation

Height:

```css
72px
```

Layout:

```text
LOGO

FEATURES
WORKFLOW
PRICING
DOCS

GET STARTED
```

Navigation styling:

```css
font-size: 13px;
font-weight: 600;
letter-spacing: 0.12em;
text-transform: uppercase;
```

---

# Hero Section

Layout:

```text
Small Label

Massive Headline

Supporting Copy

CTA Row
```

Example:

```text
SUPPORT OPERATIONS PLATFORM

CLOSE EVERY
TICKET LOOP.

Built for teams that need accountability,
visibility and reliability at scale.

[ GET STARTED ]
[ VIEW DEMO ]
```

---

# Buttons

## Border Radius

```css
0px
```

or

```css
2px
```

Maximum.

---

## Shape

Buttons should use clipped geometry.

Examples:

* Cut corners
* Angular edges
* Tactical styling

Not:

```css
border-radius:999px;
```

---

## Primary Button

```css
background:#FF4655;
color:white;
border:none;
```

---

## Secondary Button

```css
background:white;
border:1px solid #0F1923;
color:#0F1923;
```

---

## Hover

```css
translateY(-1px);
```

or

```css
border-color change
```

Only subtle movement.

---

# Cards

Cards should feel engineered.

Style:

```css
background:white;
border:1px solid #E5E7EB;
border-radius:0;
```

Avoid:

```css
box-shadow:0 20px 60px;
```

Use borders instead of shadows.

---

# Feature Sections

Structure:

```text
01

AUTOMATIC ASSIGNMENT

Automatically route tickets
to the right owner.
```

Large background numbers:

```css
font-size:72px;
opacity:0.08;
font-weight:800;
```

---

# Section Labels

Every major section should start with:

```text
FEATURES
WORKFLOW
SECURITY
INTEGRATIONS
```

Style:

```css
font-size:12px;
letter-spacing:0.2em;
text-transform:uppercase;
color:#FF4655;
font-weight:700;
```

---

# Border Language

The website should heavily use:

* Top borders
* Left accent borders
* Section dividers
* Grid separators

Examples:

```css
border-left:4px solid #FF4655;
```

```css
border-top:2px solid #0F1923;
```

This should become a signature visual motif.

---

# Background Details

Introduce extremely subtle:

* Grid lines
* Technical patterns
* Measurement marks
* Section dividers

Opacity:

```css
0.03 - 0.05
```

The user should barely notice them.

They should create a feeling of precision.

---

# Motion Design

Motion should feel mechanical.

Not playful.

Animation duration:

```css
150ms
200ms
250ms
```

Maximum.

---

Allowed:

* Fade
* Slide
* Border reveal
* Underline expansion

Avoid:

* Bounce
* Elastic effects
* Large parallax

---

# Imagery

Avoid:

* Happy people stock photos
* Cartoon illustrations
* 3D blobs

Prefer:

* Product screenshots
* Dashboard mockups
* Abstract technical diagrams
* Wireframe-inspired visuals
* Grid overlays

---

# Component Rules

## Inputs

```css
height:48px;
border-radius:0;
border:1px solid #D1D5DB;
```

Focus state:

```css
border-color:#FF4655;
```

---

## Tables

Should resemble enterprise monitoring software.

Use:

* Strong headers
* Clean borders
* High readability

No excessive striping.

---

## Badges

```css
border-radius:0;
padding:4px 8px;
font-size:12px;
font-weight:600;
text-transform:uppercase;
```

---

# Final Design Goal

When users land on the site they should think:

> "This product looks reliable, organized, and built for serious operational teams."

NOT:

> "This looks like a gaming website."

The design should borrow Valorant's sharp geometry, typography hierarchy, and disciplined use of red while translating those ideas into an enterprise-grade SaaS experience.
