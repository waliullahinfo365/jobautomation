# Cursor Task — PHASE 4: Verification & Completion

## Context

You completed Phase 3 (Apply Fixes) and reported success — TypeScript passes, build passes, lucide imports removed, charts updated. **Build passing is not proof of design consistency.** TypeScript and esbuild cannot tell me whether a page still looks like the pre-redesign light-theme version.

Your Phase 3 summary mentioned ~6 of the 12 planned fixes by name. The other ~6 are unaccounted for in the summary. You also explicitly admitted: *"we can sweep any remaining hardcoded slate-\* / blue-\* in report previews (e.g. WeeklyReportPreview metrics) for full token parity."* That admission alone proves the work is not done.

This phase has one rule: **trust nothing, verify everything**. For each claim, produce evidence (file paths, line numbers, command output, before/after snippets). No "I updated X" without proof.

---

## Phase structure

1. **Section A — Self-audit by fix number**: For all 12 fixes from the original plan, report status with evidence
2. **Section B — Greppable verification**: Re-run the original audit greps to confirm zero leftover anti-patterns
3. **Section C — Close admitted gaps**: Finish the slate/blue sweep you flagged as incomplete
4. **Section D — Visual reality check**: Describe the current state of each module so I can spot-check
5. **Section E — Final completion report**: Confirm done with full evidence

Stop after Section A and wait for me to review before proceeding to B–E. Do not skip ahead.

---

## SECTION A — Self-audit of each plan item with evidence

For each of the 12 fixes from the approved Phase 2 plan, report in **exactly this format**:

```markdown
### Fix #N: [name]

**Status**: ✅ Complete  /  ⚠️ Partial  /  ❌ Not done  /  🟡 Skipped (with reason)

**Evidence**:
- File: path/to/file.tsx
  - Lines changed: [range]
  - Before: `[exact old code snippet]`
  - After: `[exact new code snippet]`
- File: path/to/another.tsx
  - [same]

**Verification command run**:
```
[the actual grep / command you ran to confirm]
```
**Output**:
```
[paste the actual output]
```

**Gaps remaining (if Partial)**:
- [specific file:line that still has the issue]
- [specific file:line that still has the issue]
```

Go through all 12 in order:

### Fix #1: Dashboard token bridge (CSS + optional wrapper)
Did you actually create or modify the CSS that maps Shadcn primitives to `--surface-*` under `.dashboard-bg`? Show me:
- The file (`jobflow-premium.css` / `globals.css` / new file)
- The actual CSS rules added
- A grep proving `.dashboard-bg` is applied to the dashboard shell

### Fix #2: Table primitive — surface-aware header/footer
The original audit flagged `apps/web/src/components/ui/table.tsx` lines 14, 24, 57 using `bg-slate-50, dark:bg-slate-900`. Show me:
- Current contents of those exact lines
- A diff vs the original
- A grep confirming no `slate-50` / `slate-900` remain in `table.tsx`

### Fix #3: Badge default + semantic variants
The audit flagged `ui/badge.tsx` default variant uses `bg-slate-100 text-slate-700`. Show me:
- Current default variant
- All variants now defined
- Whether you added jf-tag / dl-tag-style variants or kept defaults

### Fix #4: PageHeader — accent chip + optional icon tile
The audit flagged `components/shared/PageHeader.tsx` eyebrow uses `bg-blue-100 / text-blue-700`. Show me:
- Current eyebrow markup and classes
- Whether the icon-tile + title + subtitle pattern from `.panel-head` was added
- Which pages now show an icon tile in their header (list them)

### Fix #5: Empty / loading / error shared components
The audit flagged `EmptyState` uses dashed `premium-card`, not concentric rings. Also `LoadingState` and `ErrorState` had lucide. Show me:
- `EmptyState.tsx` current markup — does it match `.empty` from `index.html` (concentric pseudo-element rings, jf-empty title pattern, accent CTA chip)?
- `LoadingState.tsx` — what icon does it use now? Is the spin animation token-aligned?
- `ErrorState.tsx` — same question

### Fix #6: Icon batch 1 — filters + small UI
You said you migrated lucide. Show me:
- `grep -rn "from 'lucide-react'" apps/web/src/components/shared/` — should be empty
- `grep -rn "from 'lucide-react'" apps/web/src/components/ui/select.tsx`
- `grep -rn "from 'lucide-react'" apps/web/src/components/ui/checkbox.tsx`
- All `*Filters.tsx` files: what icons are used now?

### Fix #7: Icon batch 2 — feature modules
Run and paste the output of:
```bash
grep -rn "lucide-react" apps/web/src/ --include="*.tsx" --include="*.ts"
```
Expected: zero matches. If non-zero, list each one.

### Fix #8: Jobs KpiCard light strips
The audit flagged `apps/web/src/app/(dashboard)/jobs/page.tsx` lines 132–138 with `border-slate-200 bg-white`. Show me:
- Current content of those lines
- Whether the KPI strip now uses `--surface-2` / `--border-default` / `--text-1`
- Whether it visually matches the Dashboard `.kpi` cards

### Fix #9: Token sweep — slate/white → variables
This is the big one. Run:
```bash
grep -rEn "(bg|text|border|ring|divide|placeholder)-(slate|gray|zinc|neutral|stone|white|black)-?[0-9]*" apps/web/src/app/\(dashboard\) apps/web/src/components/dashboard apps/web/src/components/jobs apps/web/src/components/applications apps/web/src/components/contacts apps/web/src/components/interviews apps/web/src/components/documents apps/web/src/components/reports apps/web/src/components/automation apps/web/src/components/settings apps/web/src/components/system --include="*.tsx" --include="*.ts" 2>/dev/null
```

Paste the **complete output**. Then for each match, classify:
- **Legit** (e.g. `bg-white` inside an icon SVG, `text-black` on a printable export) — explain
- **Leftover** — needs to be replaced with a token

I expect a non-zero number of leftovers. Be honest.

### Fix #10: Reports chart colors
You said charts now use CSS variables. Show me:
- The actual `stroke=` / `fill=` values now used in:
  - `PipelineConversionChart.tsx`
  - `ResponseRateTrendChart.tsx`
  - `ApplicationsBySourceChart.tsx`
- Are they `var(--accent)` / `var(--emerald)` / etc., or hex fallbacks?
- If hex fallbacks: are they at least the design tokens' hex values from `index.html`?

### Fix #11: Button / motion alignment
You did not mention this in your summary. Show me:
- `apps/web/src/components/ui/button.tsx` current hover transform
- Is it `translateY(-1px)` max, or still `-translate-y-0.5` (which is 2px)?
- Is the duration 140ms / 220ms (token), or default 200ms / 300ms?

### Fix #12: Dead code + final grep
- Did you remove or migrate `config/navigation.ts`? Show current content.
- Run a final lucide grep across `apps/web/src/` and paste output.

---

## After Section A

Stop. Do not proceed to B–E until I review and respond.

I will respond with one of:
- **"Continue"** → proceed to Section B
- **"Fix these first: [list]"** → address the partials/gaps before continuing
- **"Show me [specific thing]"** → produce more evidence for that item

---

## SECTION B — Greppable verification (after I say continue)

Run **all** these greps and paste **complete** output for each. Do not summarize, do not paraphrase, paste raw output.

### B.1 — Lucide imports under app source
```bash
grep -rn "lucide-react" apps/web/src/ --include="*.tsx" --include="*.ts"
```
Expected: zero matches. If matches exist, list each as a remaining task.

### B.2 — Other third-party icon libs
```bash
grep -rEn "from ['\"]@?(heroicons|react-icons|tabler-icons|@radix-ui/react-icons)" apps/web/src/ --include="*.tsx" --include="*.ts"
```
Expected: zero matches.

### B.3 — Hardcoded greys/colors in dashboard route group + components
```bash
grep -rEn "(bg|text|border|ring|divide|placeholder)-(slate|gray|zinc|neutral|stone)-[0-9]+" apps/web/src/app/\(dashboard\) apps/web/src/components/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Expected: zero matches. List every match if non-zero with file:line.

### B.4 — Hardcoded white/black backgrounds
```bash
grep -rEn "(bg|text)-(white|black)([^/-]|$)" apps/web/src/app/\(dashboard\) apps/web/src/components/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Some are legit (icon fills, button text on gradient). Classify each.

### B.5 — Hardcoded hex colors in styles/className
```bash
grep -rEn "#[0-9a-fA-F]{3,8}" apps/web/src/app/\(dashboard\) apps/web/src/components/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "\.svg" | grep -v "//"
```
Charts may have legit fallbacks. Classify each.

### B.6 — Old shadow values (not from token system)
```bash
grep -rEn "(shadow-(sm|md|lg|xl|2xl)|box-shadow:)" apps/web/src/app/\(dashboard\) apps/web/src/components/ --include="*.tsx" --include="*.ts"
```
Should resolve to `--shadow-card` / `--shadow-pop` / `--shadow-glow` or be absent.

### B.7 — Wrong font families
```bash
grep -rEn "font-(family|sans|serif|mono):|fontFamily" apps/web/src/ --include="*.tsx" --include="*.ts" --include="*.css"
```
Only Manrope / JetBrains Mono / Instrument Serif allowed. Anything else flag.

### B.8 — Old transitions
```bash
grep -rEn "transition-all|duration-(100|150|200|300|500|700|1000)" apps/web/src/app/\(dashboard\) apps/web/src/components/ --include="*.tsx"
```
Reference uses 140 / 220 / 420 ms only.

### B.9 — Old hover lifts
```bash
grep -rEn "(hover:)?-translate-y-(0\.5|1|1\.5|2)" apps/web/src/components/ --include="*.tsx"
```
Reference uses `translateY(-1px)` max — equivalent to nothing larger than `-translate-y-px` in Tailwind.

### B.10 — Card primitive usage on dashboard pages
```bash
grep -rn "from \"@/components/ui/card\"" apps/web/src/app/\(dashboard\) apps/web/src/components/dashboard apps/web/src/components/jobs apps/web/src/components/applications apps/web/src/components/contacts apps/web/src/components/interviews apps/web/src/components/documents apps/web/src/components/reports apps/web/src/components/automation apps/web/src/components/settings apps/web/src/components/system --include="*.tsx"
```
List every usage. Confirm each renders against `--surface-2` (either via the token bridge from Fix #1, or by replacing with `jf-panel`).

---

## SECTION C — Close admitted gaps

You explicitly mentioned: *"we can sweep any remaining hardcoded slate-\* / blue-\* in report previews (e.g. WeeklyReportPreview metrics) for full token parity."*

Do that sweep now. Specifically:

- `apps/web/src/components/reports/WeeklyReportPreview.tsx`
- `apps/web/src/components/reports/DailyDigestPreview.tsx`
- `apps/web/src/components/reports/ReportsOverview.tsx`
- Any other `*Preview.tsx` / `*Overview.tsx` under reports

For each file:
1. Grep for `slate-` and `blue-` and any other tailwind palette colors
2. Replace with token-mapped classes (`bg-[var(--surface-2)]` / `text-[var(--text-1)]` / etc., or jf-* utility classes)
3. Show diff

Then run `grep -rE "(slate|blue)-[0-9]+" apps/web/src/components/reports/` and paste the output (expected: zero).

Plus address anything else that came up as **Partial** or **Not done** in Section A.

---

## SECTION D — Visual reality check

For each module, write a **3-line description** of how the page looks RIGHT NOW after your fixes, focused on:
1. **Background + cards**: what surfaces appear?
2. **Icons + buttons**: any leftover light-theme elements?
3. **Empty/loading/data states**: which is currently visible? Does it match the reference?

Use this format per page:

```
### Jobs (/jobs)
- Surfaces: dashboard-bg base, KPI strip uses --surface-2, JobTable rows on --surface-1
- Icons: all custom (verified), Filters search input now matches Topbar pattern
- States: list state visible (5 jobs), no empty state to inspect
- Concerns: [anything you're unsure about]
```

Do this for: Dashboard, Jobs, Job detail, Applications, Contacts, Interviews, Documents, Reports, Automation, Settings, Demo Walkthrough, System Status.

This gives me a checklist for **manual screenshot verification**. I will compare your description against what I see and flag any discrepancy.

---

## SECTION E — Final completion report

Once Sections A–D are clean, produce:

```markdown
# Phase 4 — Verification Complete

## Status by fix
| # | Fix | Status | Evidence file |
|---|---|---|---|
| 1 | Token bridge | ✅ | [path] |
| 2 | Table primitive | ✅ | [path] |
[...12 rows]

## Greppable confirmations
| Check | Expected | Actual |
|---|---|---|
| lucide-react imports | 0 | 0 |
| @heroicons imports | 0 | 0 |
| slate/gray/zinc/neutral/stone classes | 0 | [N — all in legit edge cases] |
| Hardcoded hex outside charts | 0 | 0 |
| transition-all duration-N | 0 | 0 |
| -translate-y-(0.5\|1\|1.5\|2) | 0 | 0 |

## What I changed in Phase 4
- [file] — [change]
- [file] — [change]

## What's intentionally not changed
- [item with reason]
- [item with reason]

## Outstanding decisions for the user
- [anything that needs human judgment]

## Ready for screenshot review
- [ ] Dashboard
- [ ] Jobs
- [ ] Job detail
- [ ] Applications
- [ ] Contacts
- [ ] Interviews
- [ ] Documents
- [ ] Reports
- [ ] Automation
- [ ] Settings
- [ ] Demo Walkthrough
- [ ] System Status
```

---

## Hard rules — same as before

- ❌ Do NOT mark anything ✅ Complete without code-level evidence
- ❌ Do NOT use phrases like "should be working" / "I believe X is done" / "looks correct"
- ❌ Do NOT skip greps because you "remember" doing the work
- ❌ Do NOT add new dependencies, new state, or new icons-from-third-party
- ❌ Do NOT expand scope beyond Sections A–E
- ✅ DO be honest if a fix was partial or skipped — that's actionable, "looks done" is not
- ✅ DO paste raw command output, not summaries

---

## Why this matters

The original audit found 95+ inconsistencies across ~70 files. Your Phase 3 summary listed ~6 of 12 planned fixes by name and explicitly said "we can sweep [X] for full token parity" — meaning the work is not parity-complete. A passing build proves the code compiles, not that the design is consistent. I need evidence-level proof, not assurance.

---

## Begin

Start with **SECTION A**. Walk through all 12 fixes in order with evidence. Stop and wait after Section A.
