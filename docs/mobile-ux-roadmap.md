# Mobile UX Roadmap

Product goal: the **entire SaaS** should feel native on phone — one-handed, thumb-reachable, no horizontal table traps, and no content hidden behind the bottom nav or sticky bars.

---

## Design principles

1. **Thumb zone first** — primary actions live in the bottom third.
2. **44px minimum touch targets** — buttons, nav, inputs on mobile.
3. **Safe areas** — `env(safe-area-inset-*)` on top bar, bottom nav, sheets, auth.
4. **Shared layout tokens** — `apps/web/src/styles/mobile-chrome.css`.
5. **Cards over tables on `<md`** — every list view should have a card fallback.
6. **Bottom sheets for detail panels** — Applications, Contacts, Interviews, Automation.

---

## Implemented (full-product pass)

| Area | Change |
|------|--------|
| **Global** | `Button` / `Input` mobile defaults (44px); `useIsMobile` hook |
| **Layout** | Bottom nav safe-area; `pb-mobile-shell`; mobile search + New Job in top bar |
| **Detail panels** | `ResponsiveDetailPanel` — bottom sheet on phone, drawer on desktop |
| **Tabs** | Horizontal scroll on Reports, Documents, Interviews tabs |
| **Today** | Recent jobs cards on mobile |
| **Jobs** | Cards (existing); `?q=` search + `?add=1` from mobile nav |
| **Applications** | Cards (existing); detail bottom sheet |
| **Documents** | All docs, PDF exports, folder activity — cards on mobile |
| **Interviews** | Completed + automation logs — cards on mobile |
| **Reports** | PDF exports + report history — cards on mobile |
| **Automation** | Log table — cards on mobile; detail bottom sheet |
| **Contacts** | Cards (existing); detail bottom sheet |
| **Apply Assistant** | Sticky bar, bottom sheet complete flow |
| **Auth** | Login/register safe-area padding |
| **Settings** | Nav buttons 44px tall |
| **Page headers** | Actions stack full-width on mobile |

---

## Remaining polish (optional)

| Item | Notes |
|------|-------|
| PWA manifest | Add-to-homescreen |
| Job detail “More tools” menu | Surface hidden desktop-only actions on `<md` |
| Quick Review height | Use `--mobile-chrome-*` in swipe session |
| iOS Safari file handoff QA | Share sheet vs download matrix |

---

## Test checklist (phone)

1. **Today** — recent jobs show as cards, not wide table.
2. **Search** (magnifier in top bar) → type company name → lands on Jobs filtered.
3. **+** in top bar → Add Job modal opens.
4. **Applications** — tap row → bottom sheet, not clipped drawer.
5. **Documents / Interviews / Reports** — no horizontal scroll traps on main lists.
6. **Automation** — module detail opens as bottom sheet.
7. Scroll any page — content clears bottom nav.

---

## Related docs

- `docs/manual-apply-mobile-spec.md` — client manual-apply requirements
- `docs/demo-walkthrough.md` — demo script
- `docs/qa-checklist.md` — release QA
