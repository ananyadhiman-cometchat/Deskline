# CometChat Skills & docs-mcp — Integration Feedback (Step 3)

> **What this is:** the critical **Step 3 feedback report** for the Iterative Skills Reviewer task — the issues, gaps, retries, and ease-of-integration scores encountered while integrating CometChat into **DeskLine** (an existing IT-helpdesk app) using **Claude Code + cometchat-skills + docs-mcp**.
>
> **How this differs from [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md):** that doc shows the skills were *understood and used effectively* (positive framing for the assignment). **This** doc is the adversarial counterpart — it exists to make the skills and MCP measurably better. Every item here is a candidate improvement for `cometchat/cometchat-skills` or `cometchat/docs-mcp`.
>
> **Status:** living document. This is **Run 01** (DeskLine / helpdesk / Web + Flutter). Step 4 aggregates one section like this per use case, then rolls the findings up into a consolidated report. See [§9 Feeding Step 4](#9--how-this-feeds-step-4).

---

## 1. Run context

| Field | Value |
|---|---|
| **Use case** | IT helpdesk / ticketing with role-based access (employee / agent / supervisor / admin) |
| **Repo** | `ananyadhiman-cometchat/Deskline` |
| **Baseline branch** | `main` (Step 1 app, no CometChat) |
| **Integration branch** | `cometchat-integration` (Step 2 diff) |
| **AI agent** | Claude Code (Opus) |
| **Platforms integrated** | Web (React + Vite + TS), Mobile (Flutter), Backend (Node/TS, REST v3) |
| **Products** | Chat + Voice/Video calling + AI agent + AI moderation + webhooks + push |
| **Skills pinned** (`skills-lock.json`) | `cometchat`, `cometchat-a11y`, `cometchat-calls`, `cometchat-i18n` — **4 skills** |
| **Skills actually needed** | Above **+ Flutter v5 family + React calls/patterns** (used but *not* pinned — see [G-5](#g-5-skills-lock-under-captured-the-skills-actually-used)) |

### Package versions integrated

| Layer | Package | Version |
|---|---|---|
| Web chat SDK | `@cometchat/chat-sdk-javascript` | `^4.1.11` |
| Web UI Kit | `@cometchat/chat-uikit-react` | `^6.5.2` |
| Web calls | `@cometchat/calls-sdk-javascript` | `^5.0.1` |
| Mobile UI Kit | `cometchat_chat_uikit` (Flutter) | `^5.0.0` |
| Mobile calls | `cometchat_calls_sdk` (Flutter) | `^5.0.2` |

> ⚠️ **Version-pairing note:** the web stack pins **chat SDK v4** under **UI Kit v6**. This pairing worked but is non-obvious; the skills should state the supported SDK↔UIKit version matrix explicitly (see [G-6](#g-6-no-explicit-sdk--ui-kit-version-compatibility-matrix)).

---

## 2. Ease-of-integration scorecard

Scale: **1 = fought the agent the whole way**, **5 = worked first try, no manual fixes**. Scores are from the documented Run 01 experience and will be normalized across runs in Step 4.

| Platform / product | Score (1–5) | Rough time | Retries / manual corrections | Notes |
|---|:---:|---|---|---|
| Web — **chat** (list/composer/header) | **4** | ~half day | Low | Skills produced clean, working chat UI; manual work was mostly convention-matching. |
| Web — **calling** | **2** | ~1.5 days | **High** | Three separate CSS/DOM/layout workarounds needed (see [ISS-1](#iss-1--web-calls--ongoing-call-ui-trapped-in-parent-stacking-context)–[ISS-3](#iss-3--web-calls--incoming-call-card-hardcoded-to-top-left-collides-with-app-chrome)). Biggest pain point of the whole integration. |
| Web — **moderation / webhooks** | **4** | ~half day | Low–Med | Scaffolded well; webhook payload-shape handling hardened by hand. |
| Backend — **auth token / user sync** | **4** | ~half day | Low | Server-side token + idempotent sync came out clean. |
| Backend — **1:1 → group migration** | **2** | ~1 day | **High** | No first-class recipe for migrating a 1:1 to a group with history (see [ISS-4](#iss-4--chat-model--no-recipe-for-11--group-migration-with-history-retention)). |
| Mobile — **Flutter chat + calls** | **3** | ~1 day | Med | Worked, but Flutter skills were not pinned and cross-platform call parity needed manual tuning. |
| **a11y / i18n** | **3** | ~half day | Med | Skills gave correct guidance but no auto-wiring into our component structure. |

**Overall Run 01 ease: 3 / 5.** Chat + backend are strong; **calling on web is the weak spot** and dominated the retry budget.

---

## 3. Which skills triggered (and whether the right variant was picked)

| Expectation | What happened | Verdict |
|---|---|---|
| `cometchat` dispatcher detects React/Vite web | Triggered, routed to React family correctly | ✅ |
| `cometchat-calls` for voice/video | Triggered; produced SDK init + `CometChatCallButtons` | ⚠️ produced code, but **missed the layout/stacking-context failure modes** ([ISS-1](#iss-1--web-calls--ongoing-call-ui-trapped-in-parent-stacking-context)–[ISS-3](#iss-3--web-calls--incoming-call-card-hardcoded-to-top-left-collides-with-app-chrome)) |
| Flutter v5 family for mobile | Used, but **not captured in `skills-lock.json`** | ⚠️ ([G-5](#g-5-skills-lock-under-captured-the-skills-actually-used)) |
| `cometchat-a11y`, `cometchat-i18n` | Triggered; correct guidance | ⚠️ needed manual wiring |
| Correct version variant (v5 vs v6, Compose vs Views) | Web landed on UIKit v6; Flutter on v5 | ✅ but version matrix undocumented ([G-6](#g-6-no-explicit-sdk--ui-kit-version-compatibility-matrix)) |

---

## 4. Issues found (grounded in shipped workaround code)

Severity: 🔴 blocker-level (needed non-obvious workaround) · 🟡 friction · 🟢 minor.

### ISS-1 🔴 [Web / calls] Ongoing-call UI trapped in parent stacking context
- **Symptom:** when a user initiates a call, `CometChatMessageHeader` renders the **ongoing-call UI inside itself**. The chat container (`.ticket-chat-section`) has `position: fixed; z-index: 50; overflow: hidden` and a fixed height — this creates a **CSS stacking-context ceiling**. The call UI is clipped to a thin strip; the app navbar (z-index 100) and AI button (z-index 1000) render on top of it.
- **Why CSS alone can't fix it:** a child's `position: fixed` **cannot escape a parent's stacking context**. Even `z-index: 2147483647` on the call element loses, because the parent is capped at `z-index: 50` relative to its siblings.
- **Workaround shipped:** [`web/src/cometchat/components/OngoingCallElevator.tsx`](web/src/cometchat/components/OngoingCallElevator.tsx) — a `MutationObserver` watches for `.cometchat-ongoing-call` anywhere in the DOM, then **physically reparents** it into a `document.body`-level overlay (`position: fixed; z-index: 2147483647`), plus a **500 ms polling interval** to detect call-end (no iframes / empty call element) and tear the overlay down.
- **Why this is bad feedback:** this is a **brittle DOM hack** against internal, undocumented CometChat class names (`cometchat-ongoing-call` / `cometchat__ongoing-call` / `cc-ongoing-call` — we had to match all three). It breaks the moment the kit renames a class or changes its DOM. A production integrator should never need a MutationObserver to display a call.
- **Ask of the skill (`cometchat-calls` / `cometchat-react-calls`):**
  1. **Warn** that call UI must be mounted outside any ancestor that creates a stacking context (`position: fixed/sticky`, `transform`, `filter`, `z-index` + `overflow: hidden`).
  2. Ship a **supported portal / render-target API** (e.g. "render the ongoing call into a container you control at body level") so no DOM reparenting is needed.
  3. Document the **stable public class/data-attribute** for the ongoing-call root, so integrators aren't matching three guessed class names.

### ISS-2 🔴 [Web / calls] Call view and chat view overlap — no coexistence layout
- **Symptom:** even after elevating the call UI, the **call was continuously hidden behind the chat interface** (and vice-versa) because both occupy the same ticket route.
- **Workaround shipped:** a **toggle button** ("Show Chat" / "Show Call") in `OngoingCallElevator.tsx` that switches which surface is visible.
- **Ask of the skill:** provide a **layout recipe** for "chat + active call on the same screen" — the common patterns (call as full-screen overlay with a minimize-to-PiP, or split view). Right now the skill wires the buttons but is silent on what the screen should look like once a call is live.

### ISS-3 🟡 [Web / calls] Incoming-call card hardcoded to top-left, collides with app chrome
- **Symptom:** `CometChatIncomingCall` renders its accept/decline card **pinned to the top-left**, where it overlaps the app's top navbars in several layouts.
- **Workaround shipped:** [`web/src/cometchat/components/IncomingCallHandler.tsx`](web/src/cometchat/components/IncomingCallHandler.tsx) mounts it at app root wrapped in a `.cometchat-call-overlay` fixed container, plus CSS in `index.css` to reposition.
- **Ask of the skill:** the "mount `<CometChatIncomingCall />` at root" instruction should come **with** guidance/props for **placement and z-index** relative to existing app chrome, not just the mount point. Flag that default positioning assumes an empty app shell.

### ISS-4 🟡 [Chat model] No recipe for 1:1 → group migration with history retention
- **Symptom:** the desired UX is a ticket chat that **starts 1:1 and smoothly becomes a group** as more members (supervisor, AI→human handoff) are added, **retaining the full conversation history**. The skills offer either a 1:1 model or a group model, but **no first-class "migrate 1:1 to group without losing history"** recipe.
- **Workaround shipped:** modeled *every* ticket as a group from the start (`ticket-{id}`) so "escalation" is just `addMember` — plus a documented Data Import API path for true history migration. See memory note `deskline-cometchat-1to1-to-group` and [COMETCHAT_INTEGRATION.md §3](COMETCHAT_INTEGRATION.md).
- **Ask of the skill (`cometchat` core):** add an explicit **"conversations that grow"** recipe — when to start as a group vs. when/how to migrate a 1:1 to a group with history (Data Import API), including the trade-offs. This is a common real-world helpdesk/marketplace/support pattern.

### ISS-5 🟡 [a11y / i18n] Guidance correct but no auto-wiring
- **Symptom:** `cometchat-a11y` and `cometchat-i18n` gave correct direction but still required **manual wiring into our component structure** (see USAGE doc "Limitations").
- **Ask:** provide copy-paste wiring for the common host structures (provider + list + composer) rather than principles-only guidance.

---

## 5. Wrong / outdated / hallucinated / missing

| Type | Detail | Impact |
|---|---|---|
| **Missing failure-mode docs** | Calls skill never mentions stacking-context / overlay / positioning constraints ([ISS-1](#iss-1--web-calls--ongoing-call-ui-trapped-in-parent-stacking-context)–[ISS-3](#iss-3--web-calls--incoming-call-card-hardcoded-to-top-left-collides-with-app-chrome)) | **High** — cost ~1.5 days of the run |
| **Missing recipe** | No 1:1→group-with-history migration path ([ISS-4](#iss-4--chat-model--no-recipe-for-11--group-migration-with-history-retention)) | Medium |
| **Under-specified security** | Webhook skill scaffolded the handler but left verification to the integrator (we chose edge Basic Auth; `COMETCHAT_WEBHOOK_SECRET` left reserved for HMAC) | Medium |
| **Payload-shape drift** | Real webhook payloads carried conversation IDs in several shapes (`group_…`, raw, `receiver`); skill assumed one shape → hardened by hand | Medium |
| _Hallucinated APIs_ | _None confirmed in Run 01 — **to be tracked per run in Step 4.**_ | — |

> **Note:** fill the hallucination row as real cases appear across Step 4 runs. Keep it — an empty "no hallucinations" result is itself a finding.

---

## 6. Gaps (things the skills/MCP don't cover)

- **G-1 — Calls + chat coexistence layout.** No layout recipe when both are live on one screen ([ISS-2](#iss-2--web-calls--call-view-and-chat-view-overlap--no-coexistence-layout)).
- **G-2 — Call UI portal/placement.** No supported render-target; integrators resort to DOM hacks ([ISS-1](#iss-1--web-calls--ongoing-call-ui-trapped-in-parent-stacking-context), [ISS-3](#iss-3--web-calls--incoming-call-card-hardcoded-to-top-left-collides-with-app-chrome)).
- **G-3 — Conversation lifecycle migration.** 1:1→group with history ([ISS-4](#iss-4--chat-model--no-recipe-for-11--group-migration-with-history-retention)).
- **G-4 — RBAC → CometChat mapping.** We mapped app roles/departments to CometChat **tags** (`role:*`, `dept:*`) by hand. A skill recipe for "mirror your app's RBAC into CometChat groups/tags/scopes" would remove guesswork.
- <a id="g-5-skills-lock-under-captured-the-skills-actually-used"></a>**G-5 — `skills-lock.json` under-captured the skills actually used.** Only 4 skills pinned, but Flutter v5 + React calls/patterns were used. The lock should reflect the *full* set actually consulted for reproducibility.
- <a id="g-6-no-explicit-sdk--ui-kit-version-compatibility-matrix"></a>**G-6 — No explicit SDK↔UI Kit version matrix.** Web ran chat SDK v4 + UIKit v6; that this pairing is supported was undocumented.
- **G-7 — Graceful-degradation pattern.** "CometChat outage must not block core auth" (login/register returning `cometchatAuthToken: null`, background sync) was designed by hand. Worth a first-class production recipe.

---

## 7. docs-mcp feedback

> Structured per Step 3 criteria: query quality, missing/irrelevant results, latency. **Populate as docs-mcp queries are run in Step 4** — Run 01 was skills-driven.

| Query intent | Result quality | Missing / irrelevant | Latency | Notes |
|---|---|---|---|---|
| _e.g. "ongoing call custom container"_ | _TBD_ | _TBD_ | _TBD_ | Capture whether docs-mcp surfaces the stacking-context / portal guidance that the skill lacks. |
| _e.g. "migrate 1:1 to group history"_ | _TBD_ | _TBD_ | _TBD_ | |
| _e.g. "webhook signature verification"_ | _TBD_ | _TBD_ | _TBD_ | |

**Action for Step 4:** for each ISS/G item above, run the equivalent **docs-mcp** query and record whether the MCP would have answered where the skill fell short. That comparison (skill vs. MCP coverage) is itself a headline finding.

---

## 8. Prioritized improvement suggestions

**For `cometchat-skills` (highest impact first):**
1. **P0 — Calls UI placement & stacking-context guidance** + a supported portal/render-target API. Single biggest cost in Run 01 ([ISS-1](#iss-1--web-calls--ongoing-call-ui-trapped-in-parent-stacking-context)–[ISS-3](#iss-3--web-calls--incoming-call-card-hardcoded-to-top-left-collides-with-app-chrome), [G-1](#6-gaps-things-the-skillsmcp-dont-cover), G-2).
2. **P1 — "Conversations that grow" recipe** — 1:1→group with history ([ISS-4](#iss-4--chat-model--no-recipe-for-11--group-migration-with-history-retention), G-3).
3. **P1 — RBAC→CometChat mapping recipe** (tags/groups/scopes) (G-4).
4. **P2 — Version compatibility matrix** in the core skill (G-6).
5. **P2 — Production graceful-degradation recipe** (G-7) + webhook verification made non-optional.

**For `docs-mcp`:**
1. Ensure the P0/P1 topics above are **discoverable** — run the Step 4 query set and close any gaps.
2. Track latency + relevance per query so regressions are visible release-over-release.

---

## 9. — How this feeds Step 4

This document is **Run 01**. The Step 4 pipeline produces one report shaped like §1–§7 per use case, then a consolidation agent aggregates:
- **Scorecards (§2)** → averaged per platform to show where the skills are weakest across use cases.
- **Issues (§4) + Gaps (§6)** → deduped and ranked by frequency × severity → the consolidated findings report (Deliverable 3).
- **docs-mcp table (§7)** → the skill-vs-MCP coverage comparison.

**Keep this file's headings stable** — the aggregation step matches on them (`ISS-*`, `G-*`, the scorecard columns). New runs should reuse the same IDs where an issue recurs, so "how many use cases hit ISS-1" is a one-line rollup.

---

## Related docs
- [COMETCHAT_SKILLS_USAGE.md](COMETCHAT_SKILLS_USAGE.md) — the positive "how skills were used" writeup (Step 2)
- [COMETCHAT_INTEGRATION.md](COMETCHAT_INTEGRATION.md) — the integration as built
- [COMETCHAT_WEBHOOKS.md](COMETCHAT_WEBHOOKS.md) — webhook flow & security
- [DECISION_LOG.md](DECISION_LOG.md) — decisions & alternatives
