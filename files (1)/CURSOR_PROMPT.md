# Cursor Task — Apply Premium Redesign to JobFlow AI

## Context

You are implementing a premium SaaS redesign for **JobFlow AI**, an application automation dashboard. I am providing **three reference files** that contain the complete new design system, custom icons, and integration guide:

1. **`index.html`** — A standalone, fully-styled HTML demo of the new dashboard shell + main page. This is the **visual source of truth**. Every CSS variable, every component pattern, every micro-detail (spacing, borders, shadows, animations) is defined here. Treat this file as a design spec — do not deviate from its tokens or visual language.

2. **`icons.tsx`** — A complete custom React icon system with 27 icons + a `SIDEBAR_NAV` config. This is the **icon source of truth**. Drop it directly into the codebase and replace ALL existing icons (Lucide, Heroicons, etc.) used in the dashboard shell and dashboard page.

3. **`README.md`** — Implementation guide that explains the tokens, file structure, and what was redesigned. Read this first.

---

## Your task

Inspect the existing JobFlow AI codebase (Next.js / React project), then **apply the redesign from the reference files** to the actual application code. This is a **presentation-layer refactor** — do not change behavior, routes, data, or hooks.

---

## Hard rules — DO NOT BREAK

These are non-negotiable. If implementing a change requires breaking any of these, **stop and ask first**.

- ❌ Do NOT change route structure (`/dashboard`, `/jobs`, `/applications`, etc.)
- ❌ Do NOT change API hooks, data fetching logic, or mock fallback behavior
- ❌ Do NOT remove or rename existing button click handlers, form actions, or event handlers
- ❌ Do NOT change the underlying data shape passed to components
- ❌ Do NOT remove dark-mode support — the redesign IS dark mode
- ❌ Do NOT install new dependencies unless absolutely necessary (icons are inline SVG; chart code is preserved)
- ❌ Do NOT touch pages other than the Dashboard shell and Dashboard page unless they share a layout component that must be updated
- ❌ Do NOT introduce new state management, new context providers, or new global stores

---

## Step-by-step execution plan

Follow these steps **in order**. Do not skip ahead. After each step, briefly summarize what you did before moving on.

### Step 1 — Inspect & report

Before writing any code, scan the repo and report back:

1. The framework + version (Next.js App Router? Pages Router? Vite + React?)
2. The styling approach (Tailwind? CSS Modules? styled-components? plain CSS?)
3. Where the dashboard shell lives (e.g. `app/(dashboard)/layout.tsx`, `components/Sidebar.tsx`)
4. Where the dashboard page lives (e.g. `app/(dashboard)/dashboard/page.tsx`)
5. What icon library is currently used (Lucide? Heroicons? Custom?)
6. What chart library is used for the Application Pipeline (Recharts? Chart.js? Custom SVG?)
7. The existing color/theme system (CSS variables? Tailwind config? Theme provider?)

**Stop here and confirm you've understood the codebase before proceeding.**

### Step 2 — Install design tokens

Migrate the CSS custom properties from `index.html` (the entire `:root { ... }` block) into the project's global stylesheet.

- If using **Tailwind**: add the colors, font families, radii, and shadows to `tailwind.config.ts` under `theme.extend`. Also keep the raw CSS variables in `globals.css` so they can be referenced via arbitrary values like `bg-[var(--surface-2)]`.
- If using **CSS Modules / plain CSS**: paste the `:root` block into `globals.css` or `tokens.css`.
- If using **styled-components / Emotion**: convert tokens to a theme object and wrap with `ThemeProvider`.

Also add the Google Fonts imports for **Manrope**, **JetBrains Mono**, and **Instrument Serif** (see the `<link>` tags in `index.html` head). Use `next/font` if this is Next.js.

### Step 3 — Drop in the icon system

1. Create `src/components/icons/index.tsx` (or the project's equivalent path).
2. Paste the contents of `icons.tsx` exactly as-is.
3. Search the codebase for **every icon import** in the dashboard shell + dashboard page (e.g. `from 'lucide-react'`, `from '@heroicons/react'`).
4. Replace each one with the equivalent from the new icon system. Mapping:

| Old (likely Lucide name) | New |
|---|---|
| `LayoutDashboard`, `LayoutGrid` | `DashboardIcon` |
| `Briefcase` | `JobsIcon` (sidebar) or `TrackedJobsIcon` (KPI) |
| `FileText`, `Send` | `ApplicationsIcon` (sidebar) or `SendIcon` (KPI) |
| `Users`, `Users2` | `ContactsIcon` |
| `Calendar`, `CalendarCheck` | `InterviewsIcon` / `CalendarCheckIcon` |
| `Folder`, `FolderOpen` | `DocumentsIcon` |
| `BarChart3`, `BarChart` | `ReportsIcon` |
| `Zap`, `Bot` | `AutomationIcon` (sidebar) or `BotIcon` (KPI) |
| `Settings`, `Cog` | `SettingsIcon` |
| `Play`, `PlayCircle` | `DemoIcon` |
| `Activity` | `StatusIcon` or `LiveIcon` |
| `Search` | `SearchIcon` |
| `Bell` | `NotificationIcon` |
| `Sun`, `Moon` | `ThemeIcon` |
| `Plus` | `PlusIcon` |
| `ChevronDown` | `ChevronDownIcon` |
| `ChevronRight` | `ChevronRightIcon` |
| `HeartPulse`, `Stethoscope` | `HealthCheckIcon` |
| `Trophy`, `Award` | `TrophyIcon` |
| `BellRing`, `AlarmClock` | `FollowUpIcon` |
| `LineChart`, `GitBranch` | `PipelineIcon` |
| `Clock`, `Timer` | `DeadlineIcon` |
| `TrendingUp` | `TrendUpIcon` |
| `ArrowRight` | `ArrowRightIcon` |

5. Once the dashboard shell + page no longer reference any third-party icon lib, **leave the lib installed** (other pages may use it). Do not uninstall.

### Step 4 — Refactor the Sidebar

Open the existing sidebar component. Refactor it to match `index.html`'s sidebar markup and styling:

- Brand block at top: 30×30 gradient mark + name + Beta pill + "Application Automation" tagline + bottom hairline border
- Three grouped sections with uppercase section labels: **Workspace** (Dashboard, Jobs, Applications, Contacts, Interviews, Documents) → **Insights** (Reports, Automation) → **Account** (Settings, Demo Walkthrough, System Status)
- Use the exported `SIDEBAR_NAV` config from `icons.tsx` to render the nav with a single `.map()`
- Active item: left accent rail (3px gradient with glow) + soft indigo-tinted background + accent-colored icon
- Hover: subtle background lift, slight color shift
- Numeric badges (e.g. `12` next to Jobs, `2` next to Interviews) — keep the existing data source, just restyle
- System Status card at the bottom: lifted surface, emerald top stripe, pulse dot, shimmer progress bar, mono stats row

**Wire up the active state from your existing routing** (`usePathname()` in Next.js App Router, or whatever you currently use). Do not hardcode the active item.

### Step 5 — Refactor the Topbar

Match the topbar markup from `index.html`:

- Left: breadcrumb-style location indicator (`Workspace › Dashboard`)
- Center spacer
- Search input with ⌘K hint pill — **wire to the existing search handler if one exists**
- Notification icon button with red dot — wire to existing notification state
- Theme toggle icon button — wire to existing theme switcher (do not replace the theme system)
- Primary "New Job" CTA — wire to the existing handler / route
- Avatar pill: initials + name + status dot + chevron — wire to existing user data + menu

**Important:** the search ⌘K shortcut, theme toggle, and "New Job" button must keep their original functionality. You are restyling the trigger, not rewriting the behavior.

### Step 6 — Refactor the Dashboard page

Match the markup from `index.html`'s `<main class="content">` block:

#### 6a. Hero section
- Indigo accent chip "Live Automation Dashboard" with pulsing dot
- Title with one italic-serif accent word (`<em>` styled with Instrument Serif)
- Subtitle / supporting copy
- Two action buttons: secondary "Run Health Check" + primary "Add Job" — **wire to existing handlers**
- Subtle radial gradient + dot-grid mesh background

#### 6b. KPI grid
Six cards in a responsive 3-column grid:

| Card | Icon | Tint |
|---|---|---|
| Total Jobs Tracked | `TrackedJobsIcon` | indigo (default) |
| Applications Sent | `SendIcon` | violet |
| Interviews Scheduled | `CalendarCheckIcon` | teal |
| Offers Received | `TrophyIcon` | emerald |
| Follow-ups Due | `FollowUpIcon` | amber |
| Automations Active | `BotIcon` | indigo |

Each card has: label, colored icon tile, big numeric value (Manrope tabular figures), mini bar sparkline, hairline divider, delta pill + meta text. **Pull the numbers from the existing data source** — do not hardcode.

For the sparkline mini-bars, if you don't have historical data, derive a 7-bar sequence from the current value or fall back to a placeholder pattern.

#### 6c. Application Pipeline chart
- Reuse the existing chart library — do not rewrite to raw SVG unless the existing lib makes restyling impossible
- Apply the visual treatment from `index.html`: gradient indigo bars, 2.5px white top highlight (use `stroke` or a stacked rect depending on lib), dashed grid hairlines, JetBrains Mono axis labels, emerald color for the Offer stage
- Add the footer stats row: Conversion / Avg. velocity / Synced — use existing data if available, otherwise derive from the pipeline counts

#### 6d. Upcoming Deadlines panel
- If deadlines data is empty (current state): show the premium empty state — concentric ring icon, "You're all clear" title, supporting copy, "Configure reminders" CTA chip
- If deadlines exist: show the row pattern (compact date tile + title + meta + urgency tag)
- Both states are already styled in `index.html` — copy the markup and conditionally render based on the existing data

### Step 7 — Animations + micro-interactions

Apply the motion patterns from `index.html`:

- Page-load stagger on KPI cards (80ms increments via `animation-delay`)
- Card hover: `translateY(-1px)` + border color shift + corner radial glow
- Bar chart grow-up animation on mount (`scaleY` from 0 to 1, 800ms, easeOut)
- Live pulse dot keyframe animation (already in CSS)
- Progress bar shimmer (already in CSS)

If the project uses **Framer Motion**, port these to motion components. Otherwise, use the CSS keyframes from `index.html` directly.

### Step 8 — Responsive verification

Test at three breakpoints:
- **Large desktop** (≥1280px): 3-col KPI grid, 1.6:1 split for Pipeline + Deadlines
- **Laptop / tablet** (≤1180px): 2-col KPI, stacked panels
- **Mobile** (≤860px): collapsed sidebar (icons only, no labels), 1-col KPI, hidden breadcrumb, hidden avatar name

The CSS in `index.html` already handles these breakpoints — port them.

### Step 9 — Final QA checklist

Run through this list before considering the task done:

- [ ] All routes still work (click every sidebar item)
- [ ] "New Job" button opens the correct modal/route
- [ ] "Add Job" hero button works
- [ ] "Run Health Check" button works
- [ ] Theme toggle still toggles theme
- [ ] Notification button opens notification panel/menu
- [ ] Search ⌘K shortcut still focuses the input
- [ ] Avatar menu still opens the user menu
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No layout shift / overflow on resize
- [ ] All KPI numbers render from real data, not hardcoded
- [ ] Pipeline chart still receives the same data shape
- [ ] Deadlines panel correctly switches between empty state and list state
- [ ] Sidebar active item highlights based on current route
- [ ] Numeric badges (Jobs, Interviews) still reflect real counts
- [ ] No third-party icon imports remain in dashboard shell or dashboard page
- [ ] Fonts loaded correctly (Manrope visible everywhere, Instrument Serif italic in hero, JetBrains Mono on numerics)

---

## How to handle ambiguity

If you encounter something not covered by the reference files:

1. **Default to matching `index.html`'s visual language** — surface tokens, hairline borders, type scale, motion timing
2. **Default to keeping existing behavior** — if a button or hook is unclear, leave it alone
3. **Ask before adding new dependencies** — the redesign should add zero or near-zero packages
4. **Ask before changing data shapes** — if a component needs new props, ask first

If a section of the existing codebase is structured very differently from the reference (e.g. the dashboard page is split across many small files), **adapt the design to the existing structure** rather than restructuring the codebase. The goal is visual parity with `index.html`, not architectural rewrite.

---

## Output expectations

When done, give me a summary in this exact format:

```
## Files modified
- path/to/file.tsx — what changed

## Files created
- path/to/file.tsx — purpose

## Icons replaced
- Old: 12 imports from lucide-react across X files
- New: all replaced with custom icons from src/components/icons

## Tokens added
- N CSS custom properties added to globals.css
- N entries added to tailwind.config

## Functionality verified
- [list each thing from the QA checklist that you tested]

## Open questions
- [any decisions you made that you want me to confirm]
```

---

## Tone of the final result

The redesign should feel like **Linear, Vercel, Stripe, Raycast** — restrained, confident, deliberate. Not flashy. Not "AI dashboard template." Not gaming RGB. Not Dribbble-shot maximalism.

If you find yourself adding glow, gradients, or effects that aren't in `index.html`, **stop**. The reference file is intentionally restrained. Stay restrained.

---

Begin with **Step 1: Inspect & report**. Do not start coding until you've reported back what you found.
