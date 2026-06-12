# DeskLine Flutter UI Refinement Plan

## Objective

Bring the Flutter mobile app's visual identity to exact parity with the web application's design language — same fonts, color themes, animations, layout patterns, and component styling — while remaining mobile-native in interaction patterns.

---

## Current State Assessment

### What's Already Correct ✓

- Color palette matches (primaryRed #FF4655, navy #0F1923, border #E5E7EB, mutedText #6B7280)
- 0px border radius enforced on buttons, cards, inputs
- Uppercase navigation/section labels
- Border-driven cards (no shadows/elevation)
- MetricCard, StatusBadge, AppButton, AppTextField components exist
- Repository pattern with mock data ready
- Role-based routing + auth guards working
- Riverpod + GoRouter architecture solid

### What Needs Refinement / Is Missing ✗

---

## GAP ANALYSIS

### 1. TYPOGRAPHY — Font Mismatch

**Web uses:**
- `Bebas Neue` for headings/display (page-header, page-title, sidebar-logo, auth-logo)
- `Inter` for body/labels

**Flutter currently uses:**
- `Inter` for everything (including headings)

**Fix:**
- Add `Bebas Neue` font to the Flutter project (via Google Fonts package or bundled asset)
- Create `AppTypography.pageHeader` style using Bebas Neue with `letterSpacing: 0.06em`, uppercase
- Create `AppTypography.displayTitle` style using Bebas Neue for auth screens
- Apply Bebas Neue to section titles, page headers, dashboard titles, sidebar logo text

---

### 2. AUTH SCREENS — Major Visual Gap

**Web has:**
- Dark background (`#050a10`) with subtle red grid pattern overlay
- Glassmorphic card (`rgba(255,255,255,0.04)` + `backdrop-filter: blur(20px)`)
- Top red border accent (3px solid `#FF4655`)
- Logo: "DESK" white + "LINE" red in Bebas Neue
- Inputs with transparent dark background (`rgba(255,255,255,0.07)`)
- White text on dark inputs
- "SYSTEM ACCESS" title, "Authenticate to access the operational support matrix" subtitle
- CTA: "INITIALISE PROTOCOL" (tactical/clipped button style)
- Footer: "Do not have an access code? Request Clearance"
- Radial gradient orbs in background (red top-left, blue bottom-right)

**Flutter currently has:**
- White background, standard inputs on light surface
- "LOGIN" as plain section headline
- Standard "Don't have an account? REGISTER" footer

**Fix:**
- Redesign `LoginScreen` and `RegisterScreen` with dark auth theme
- Create dedicated `AuthTheme` with dark background, grid texture, gradient orbs
- Style inputs for dark mode (transparent bg, white text, red focus border)
- Match the tactical button copy ("Initialise Protocol" / "Request Clearance")
- Add DeskLine logo with accent color split

---

### 3. APP SHELL LAYOUT — Sidebar vs Bottom Nav

**Web has:**
- Fixed left sidebar (240px) with navy (`#0F1923`) background
- Logo at top, role-based nav items with left-border active indicator
- Top bar (64px) with title, notification bell, user name, logout
- Content area with generous padding (40px)

**Flutter currently has:**
- `AppShell` is a simple padding wrapper
- No proper scaffold with navigation
- Dashboard screens include inline IconButtons for navigation

**Fix:**
- For mobile: Create `AppScaffold` with a proper bottom navigation bar styled in the design language (navy background, red active indicator, uppercase labels)
- For tablets: Use a navigation rail or drawer matching the web sidebar
- Create `AppTopBar` widget matching the web topbar (border-bottom, notification bell with unread badge, user avatar)
- Ensure `page-content` padding matches (24px mobile, 40px tablet)

---

### 4. STATS/METRIC CARDS — Missing Grid Layout

**Web has:**
- `.stats-grid` — joined cards with shared outer border, separated by vertical dividers
- Large ghost number watermark (`font-size: 72px`, `opacity: 0.04`) in background
- Label in 11px uppercase tracking, value in Bebas Neue 32px

**Flutter currently has:**
- Individual `MetricCard` widgets with separate borders
- No watermark number
- Uses Inter for value

**Fix:**
- Create `StatsGrid` widget that renders a joined row of metric cells with shared border and internal vertical dividers
- Add subtle background watermark number (like the web's `::before` pseudo-element)
- Use Bebas Neue for metric values
- Match label style (11px, 700weight, 0.15em tracking, uppercase, muted color)

---

### 5. TICKET CARDS — Styling Differences

**Web has:**
- Left border colored by status (3px solid, color-coded)
- Background tinted by status (subtle, like `#fafcff` for open)
- Title in Bebas Neue/heading font, uppercase, tracking-wide
- Ticket ID row: monospace font, `##` prefix, 8-char truncated UUID, uppercase
- Badge row: status badge + priority badge
- Bottom meta row: subtype badge + category chip + assigned agent + relative time
- Hover: shadow + translateY(-1px) + border-color change

**Flutter currently has:**
- TicketCard with basic card styling, badges inside
- No status-tinted background
- No left border accent by status
- No monospace ticket ID
- No hover/press animation

**Fix:**
- Add `borderLeft` colored by status to ticket cards
- Add subtle background tint per status
- Format ticket ID as monospace, truncated, uppercase with `#` prefix
- Use heading font for title
- Add InkWell press feedback with subtle scale/elevation animation
- Reorder layout to match: title → ID+badges → meta row

---

### 6. TICKET STATUS TIMELINE — Visual Alignment

**Web has:**
- Horizontal timeline with dots (12px, square/0px radius)
- Connectors between dots (2px lines)
- Active dot: red fill + red border
- Done dot: green fill + green border + check icon
- Labels below dots (10px, 700weight, uppercase, tracking)
- Full-width flex with `flex: 1` spacing

**Flutter currently has:**
- `TicketTimeline` widget exists but needs verification of exact styling

**Fix:**
- Ensure timeline dots are square (0px radius), not circles
- Match color coding exactly (done=green, active=red, pending=border only)
- Use 10px uppercase labels with wide tracking
- Ensure connectors are 2px height lines

---

### 7. BADGES — Color System Mismatch

**Web has:**
- Solid vivid colors with white text (no outline variant):
  - `open`: `#3b82f6` (blue)
  - `in_progress`: `#f59e0b` (amber)
  - `escalated`: `#ef4444` (red) + pulse animation
  - `resolved`: `#10b981` (green)
  - `closed`: `#64748b` (slate)
  - Priority: low=green, medium=amber, high=red
  - Role: employee=indigo, agent=green, supervisor=amber, admin=red
  - Subtype: information=blue, action=green, conversation=indigo, escalation=red
- Border-radius: 2px
- Font: 11px, 700weight, 0.1em tracking, uppercase
- Border: 1.5px solid transparent

**Flutter currently has:**
- StatusBadge with configurable colors (needs verification of exact color mapping)

**Fix:**
- Create comprehensive badge color map matching web exactly
- Add `borderRadius: 2px` (not 0px — badges use `--radius-sm`)
- Match font size (11px), weight (700), letter-spacing (0.1em)
- Add pulse animation for escalated badges
- Ensure all badge variants (status, priority, role, subtype) have matching color pairs

---

### 8. FORM ELEMENTS — Input Styling Gaps

**Web has:**
- Label: 11px, 700weight, 0.14em tracking, uppercase, navy color
- Required indicator: red asterisk after label
- Input: height 48px, 14px font, navy text, border `#E5E7EB`, focus border red + box-shadow glow
- Error state: red border + error message below
- Hint text below input (12px, muted)

**Flutter currently has:**
- `AppTextField` with 0px radius, red focus border
- Label positioned differently (inside InputDecoration)

**Fix:**
- Move label above the input field (matching web's form-group layout)
- Add required asterisk in red
- Add hint text support
- Add focus glow effect (boxShadow equivalent using Container decoration)
- Match label typography exactly (11px, 700, 0.14em)

---

### 9. SECTION LABELS — Wrong Component

**Web uses two patterns:**
- `.section-label`: Bebas Neue 14px, 0.15em tracking, uppercase, RED color
- `.page-header`: Bebas Neue 28px, 0.06em tracking, uppercase, navy color

**Flutter currently has:**
- `SectionHeader` — needs verification of exact styling

**Fix:**
- Ensure section labels use red color + Bebas Neue
- Page headers should use Bebas Neue 28px with navy
- Add the icon box pattern seen in web dashboards (44px square, red bg at 10% opacity, red border, icon inside)

---

### 10. EMPTY STATES — Styling Mismatch

**Web has:**
- Dashed border (`border: 1px dashed`)
- Centered content with generous padding (64px 24px)
- Title in heading font, uppercase, 16px, 0.08em tracking
- Description: 14px muted, max-width 300px
- Optional action button

**Flutter currently has:**
- `EmptyState` widget — needs styling verification

**Fix:**
- Use dashed border (via CustomPainter or dotted_border package)
- Match padding, title font, description styling
- Center everything with max-width constraint on description

---

### 11. TABLES — Styling Differences

**Web has:**
- Outer border wrapper
- Header: surface background, 11px bold uppercase labels, 2px bottom border
- Rows: 14px body text, 1px bottom border, hover highlight (subtle bg change)
- Cells: 14-16px padding

**Flutter currently has:**
- `DataTableCard` with DataTable widget

**Fix:**
- Ensure header text matches (11px, 700, 0.12em tracking, uppercase)
- Use 2px bottom border on header
- Row hover state (on tap highlight)
- Match cell padding

---

### 12. ANIMATIONS & TRANSITIONS — Missing

**Web has:**
- Button hover: `translateY(-1px)` + shimmer on primary
- Card hover: shadow + translateY(-1px) + border-color change
- Skeleton shimmer loader (linear gradient animation)
- Badge pulse animation (for escalated status)
- All transitions: 150ms/200ms/250ms ease (mechanical, not bouncy)

**Flutter currently has:**
- No page transitions
- No press/tap animations on cards
- No skeleton loaders
- No shimmer effects

**Fix:**
- Add page transition animations (slide/fade, 200ms)
- Add press scale animation on cards/buttons (subtle: 0.98 scale)
- Create `SkeletonLoader` widget with shimmer gradient animation
- Add escalated badge pulse animation using AnimationController
- Keep all durations under 250ms, no bounce/elastic curves

---

### 13. NOTIFICATION UI — Patterns Missing

**Web has:**
- Notification bell (36px square, border, badge with count)
- Notification items: left red border for unread, hover highlight
- Title (13px, 600weight, navy), body (12px, muted), time (11px, muted)

**Flutter currently has:**
- `NotificationCenterScreen` exists
- Notification bell as plain IconButton

**Fix:**
- Create styled `NotificationBell` widget matching web (square container, border, positioned badge)
- Style notification list items with unread indicator (left red border)
- Match text styling exactly

---

### 14. ALERT/ERROR MESSAGES — Pattern Gap

**Web has:**
- `.alert` with left accent border (4px), subtle tinted background
- Variants: error (red), success (green), warning (amber), info (blue)

**Flutter currently has:**
- Error shown in Container with red border (login screen only)
- No reusable Alert component

**Fix:**
- Create `AppAlert` widget with left accent border pattern
- Support all four variants (error, success, warning, info)
- Match padding (14px 16px), font (13px), colors

---

### 15. NAVIGATION PATTERNS — Missing Pieces

**Web has:**
- Sidebar section labels (10px, 700, 0.2em tracking, uppercase, 30% opacity white)
- Nav items with icon + label, left-border active state (3px red)
- Hover: white text + subtle bg highlight
- Disabled items with cursor-not-allowed

**Flutter (mobile) should have:**
- Bottom navigation matching the tactical style
- Active state: red indicator (top border or icon color)
- Labels: 10px uppercase, wide tracking
- Maximum 4-5 items per role

---

### 16. DARK MODE — Not Implemented (REQUIRED)

**Web has full dark mode:**
- Background: `#09090b` (pure deep black/zinc)
- Surface: `#18181b` (dark zinc for cards/panels)
- Text: `#f8fafc` (near-white)
- Border: `#27272a` (dark zinc dividers)
- Muted: `#a1a1aa` (zinc-400)
- Grid texture with white lines at 3% opacity
- Sidebar bg: `#09090b`
- All status/priority/badge colors remain vivid against dark surfaces
- Toggle via Sun/Moon icon in topbar
- Smooth transition on toggle (`transition: background-color 200ms, color 200ms`)

**Flutter currently has:**
- No dark mode at all
- No theme toggle
- No dark color tokens

**Fix:**
- Create `AppColorsDark` class with dark mode tokens:
  ```dart
  static const background = Color(0xFF09090B);
  static const surface = Color(0xFF18181B);
  static const textMain = Color(0xFFF8FAFC);
  static const border = Color(0xFF27272A);
  static const muted = Color(0xFFA1A1AA);
  static const gridLine = Color(0x08FFFFFF); // white at 3%
  ```
- Create `buildDarkAppTheme()` in `app_theme.dart` applying dark tokens to:
  - `ColorScheme.dark()` with correct surface/background/onSurface
  - Card theme (dark surface bg, dark border)
  - AppBar theme (dark bg, white text, dark border-bottom)
  - Input theme (dark bg inputs, lighter border, white text, red focus)
  - Button theme (primary red stays same, secondary uses white border on dark)
  - Divider/border uses `#27272A`
- Create `ThemeNotifier` (Riverpod StateNotifier) managing `ThemeMode`
  - Persists selection to `flutter_secure_storage`
  - Provides `themeMode` (light/dark/system)
- Create `themeProvider` exposing current `ThemeMode`
- Update `MaterialApp.router` to use:
  ```dart
  theme: buildAppTheme(),
  darkTheme: buildDarkAppTheme(),
  themeMode: ref.watch(themeProvider),
  ```
- Add Sun/Moon toggle icon in the app top bar
- Ensure all hardcoded colors in screens respect `Theme.of(context)` instead of direct `AppColors` references where needed
- Badge colors remain vivid (no change) — they pop against both light and dark surfaces
- Auth screens already use a dark theme (their own isolated dark layout) — no change needed there
- Test on both modes: cards readable, text contrast sufficient (WCAG AA minimum)

---

### 17. RESPONSIVE LAYOUT — Tablet Support

**Web uses:**
- 1280px max-width content
- 12-column grid
- Responsive breakpoints at 768px and 1024px

**Flutter should:**
- Use `LayoutBuilder` or `MediaQuery` for breakpoints
- Phone (<600dp): Bottom nav, single column, stacked cards
- Tablet (≥600dp): Navigation rail or drawer, 2-column grid for stats/cards
- Match web's padding scale (24px phone → 40px tablet)

---

## GAPS SPECIFIC TO BACKEND INTEGRATION (Not Blocking UI, But Noted)

These are architectural gaps that exist because the app uses mock repositories. They don't block UI refinement but should be documented:

1. **Token Refresh Interceptor** — Dio interceptor exists but refresh logic not wired
2. **Pagination Controls** — UI shows "More results available" but no proper pagination widget (web has `Pagination.tsx`)
3. **Real-time Notifications** — Firebase initialized but foreground handling not implemented
4. **Search/Filter UI** — Web has `TicketFilters.tsx` with proper form controls; Flutter uses basic DropdownButton
5. **Confirm Dialog** — Web has `ConfirmDialog.tsx`; Flutter uses raw AlertDialog
6. **Modal/Sheet Pattern** — Web has `Modal.tsx`; Flutter needs a styled bottom sheet
7. **Avatar Component** — Web has `Avatar.tsx`; Flutter has none
8. **Select Component** — Web has styled `Select.tsx`; Flutter uses default DropdownButton
9. **Textarea** — Web has styled `Textarea.tsx`; Flutter's TextFormField multiline needs styling

---

## IMPLEMENTATION PHASES

### Phase A: Typography & Fonts (Foundation)
1. Add Bebas Neue font (Google Fonts package or asset bundle)
2. Update `AppTypography` with heading/display styles
3. Apply throughout all screens

### Phase B: Dark Mode Infrastructure
1. Create `AppColorsDark` class with all dark tokens
2. Create `buildDarkAppTheme()` in `app_theme.dart`
3. Create `ThemeNotifier` + `themeProvider` (persists to secure storage)
4. Wire `MaterialApp.router` with `theme` / `darkTheme` / `themeMode`
5. Add Sun/Moon toggle in app top bar
6. Audit all screens for hardcoded colors — replace with `Theme.of(context)` lookups
7. Verify badge/status colors remain vivid on dark surfaces
8. Test contrast ratios meet WCAG AA

### Phase C: Auth Screen Redesign
1. Create dark auth layout with grid background, gradient orbs
2. Restyle inputs for dark theme (auth screens always dark regardless of app theme)
3. Match copy/messaging from web ("System Access", "Initialise Protocol")
4. Add DeskLine logo component

### Phase D: App Shell & Navigation
1. Create proper `AppScaffold` with bottom nav (mobile) / nav rail (tablet)
2. Create `AppTopBar` with notification bell + user section + theme toggle
3. Ensure proper page padding and content area sizing
4. Style bottom nav: navy bg (light mode) / deep black bg (dark mode), red active indicator

### Phase E: Component Refinement
1. Upgrade badges (exact color map, 2px radius, pulse animation)
2. Upgrade ticket cards (status border, tinted bg, monospace ID, heading font)
3. Create StatsGrid with joined borders and watermark numbers
4. Create SkeletonLoader with shimmer
5. Create AppAlert component
6. Upgrade EmptyState with dashed border
7. Create Avatar, Pagination, ConfirmDialog components
8. Ensure all components render correctly in both light and dark modes

### Phase F: Screen-Level Polish
1. Employee Dashboard — match web layout with page-header-icon pattern
2. Agent Inbox — proper filter bar matching web's TicketFilters
3. Supervisor Dashboard — stats grid + summary cards
4. Admin Dashboard — "Command Centre" layout with stats + activity table + chart
5. Ticket Detail — timeline + meta panel + AI reply panel

### Phase G: Animations & Micro-Interactions
1. Page transitions (fade + slide, 200ms)
2. Card press animations
3. Button shimmer on primary CTA
4. Badge pulse for escalated
5. Pull-to-refresh with styled indicator
6. Theme toggle transition (smooth crossfade between light/dark)

---

## PRIORITY ORDER (What Matters Most for Visual Parity)

| Priority | Item | Impact |
|----------|------|--------|
| P0 | Bebas Neue font for headings | Entire app looks different without it |
| P0 | Dark mode infrastructure | Web has it, users expect it, must ship |
| P0 | Auth screen dark redesign | First thing users see — major gap |
| P0 | App shell with proper navigation | Core UX structure |
| P1 | Badge color system exact match | Used everywhere |
| P1 | Ticket card redesign with status border | Most common screen |
| P1 | StatsGrid joined layout | All dashboards |
| P1 | Section labels in red + heading font | Visual identity |
| P1 | Theme toggle in top bar | Required for dark mode UX |
| P2 | Skeleton loaders | Loading states |
| P2 | Form label positioning | Auth + raise ticket |
| P2 | Empty states with dashed border | Edge cases |
| P2 | Notification bell styled | Top bar |
| P2 | Dark mode contrast audit | Accessibility |
| P3 | Animations (transitions, shimmer) | Polish |
| P3 | Alert component | Error states |
| P3 | Tablet responsive layout | Secondary device |

---

## SUMMARY

The Flutter app has a solid architectural foundation (models, repos, routing, state management) but visually deviates from the web in several impactful ways:

1. **Missing Bebas Neue** — the single biggest visual differentiator
2. **No dark mode** — web ships with full dark mode toggle; Flutter has none
3. **Auth screens are light instead of dark** — completely different feel
4. **No proper app shell/scaffold** — screens feel disconnected
5. **Stats cards are isolated instead of grid-joined**
6. **Ticket cards lack the status-tinted left border pattern**
7. **No animations/transitions** — feels static vs. the web's mechanical polish

Fixing these 7 items covers ~85% of the visual gap. The remaining 15% is component-level detail (badge colors, form labels, empty states, skeleton loaders) that can be refined iteratively.

### Dark Mode Implementation Notes

Dark mode is elevated to Phase B (right after fonts) because:
- The web already ships with it and users will expect parity
- Building it early means all subsequent component work (Phases C–G) is tested against both themes from the start, preventing expensive rework
- The auth screen redesign (Phase C) already uses a forced-dark layout, so the dark token system must exist first
- Badge/status colors are theme-invariant (vivid on both backgrounds) which simplifies the implementation
