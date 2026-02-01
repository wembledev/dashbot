# DashBot UI Overhaul — agent-visibility branch

## Branch
Work on `agent-visibility` branch. Do NOT create new branches. Commit and push to origin when done.

## Current State
- SPA layout: sidebar (left, 256px) + top bar (Chat/Status/Settings tabs) + content area
- Dark theme, Tailwind CSS, Inertia.js + React
- Sidebar has: Agents section, collapsible Crons, collapsible Sessions

## Changes Required

### 1. Text Size Bump
- All `text-xs` → `text-sm` globally
- All `text-[10px]` → `text-xs`
- All `text-[11px]` → `text-xs`
- All `text-[9px]` → `text-[10px]`
- Page headings: `text-sm` → `text-base` or `text-lg` as appropriate
- Everything should feel proportionally larger — readable dashboard, not squinting

### 2. Fix Navigation Bug (CRITICAL)
The top bar nav links (Chat, Status, Settings) don't reliably switch content. They use Inertia `<Link>` but the page content doesn't update. Debug and fix:
- Check if `AppLayout` is properly persisting as a layout (Inertia persistent layouts)
- The `showDetail` state in AppLayout may be intercepting — when nav is clicked, `selection` should be cleared AND the Inertia page should navigate
- Add `onClick` to nav Links that clears detail selection via a shared context or callback
- Test: clicking Chat → shows chat, clicking Status → shows status, clicking Settings → shows settings. Every time.

**Root cause hint:** The `showDetail` flag in `AppLayout.tsx` — when a sidebar item is selected, `showDetail = true` and the page content is replaced with DetailPanel. Clicking a nav tab does Inertia navigation but does NOT clear `selection`, so DetailPanel stays visible. Fix: clear `selection` on nav link clicks.

**Implementation:** Either:
a) Pass `onNavigate` callback from AppLayout through to TopBar that clears selection, OR
b) Use a shared context (NavigationContext) that TopBar and AppLayout both access, OR
c) In AppLayout, watch `url` changes and auto-clear selection when URL changes

Option (c) is cleanest — add a `useEffect` in AppLayout that clears `selection` when `url` changes.

### 3. Sidebar Redesign

The left sidebar should have these sections as first-class nav items:

```
AGENTS
  [Main Agent card with context %]
    ↳ sub-agent-1 (indented, with context % bar)
    ↳ sub-agent-2 (indented, with context % bar)

CRONS                    10 jobs · 2 errors
  [clickable — navigates to Crons view]

SESSIONS                 16 total · 2 active
  [clickable — navigates to Sessions view]
```

- **Sub-agents indented**: Add `ml-3` or `pl-3` + a subtle left border to show hierarchy
- **Context window %** on main agent AND sub-agents: thin progress bar under each
- **Crons**: Show as a clickable nav item with summary stats (count, error count)
- **Sessions**: Show as a clickable nav item with summary stats (total, active count)
- When Crons or Sessions is clicked, the content area shows the full list (not a sidebar dropdown)

### 4. Crons View (content area)
When "CRONS" is clicked in sidebar:
- Shows all cron jobs in a list/table
- Each row: name, schedule (human-readable), next run, last run, status dot, target (main/isolated)
- Click a cron → expands to show: full payload, recent run history, errors, enable/disable toggle, Run Now button
- Help button available for the Crons section

### 5. Sessions View (content area)
When "SESSIONS" is clicked in sidebar:
- Shows all sessions in a list/table
- Each row: label, type badge (main/cron/subagent/dashbot/channel), model, context %, age, token count
- Click a session → expands to show: full session key, kind, channel, detailed token breakdown, Close Session button
- Help button available for the Sessions section

### 6. Full Width Utilization
- Remove `max-w-[900px]` constraint on content areas
- On wide screens (>1400px), consider a two-column layout for status widgets
- Status page: use CSS grid that adapts — 1 col on small, 2 on medium, 3 on xl
- Let content breathe and use available space

### 7. Contextual Help (Major Feature)
Current: help buttons send "Explain: Widget Title — ..." to chat and show response as "Contextual Help" card.

**Changes:**
- Do NOT show "Explain: ..." text in chat. Instead, send a hidden system-style message with rich context.
- The message sent to backend should include:
  - What widget/section the user is asking about
  - Current values visible in that widget (e.g., "Main agent: claude-opus-4-5, context 34%, 68k/200k tokens")
  - What the user might want to know
- In chat, show the question as a brief, natural label like "What does this mean?" or "Help with Token Usage"
- Response card title should be contextual: "About Token Usage", "About Cron Jobs", "About Session Health" — NOT generic "Contextual Help"
- Help should be available in: Agents sidebar, Crons view, Sessions view, Status widgets, Settings page

**Example help context for Token Burn widget:**
```
User sees: Main Session 68k/200k, Context Window 34%
Message to backend: "Help me understand the Token Usage panel. Currently showing: Main Session 68k/200k tokens used, context window at 34% (68k of 200k). What do these numbers mean? When should I be concerned? What happens when context window fills up?"
Display in chat: "Help: Token Usage" (small, subtle)
Response card title: "About Token Usage"
```

### 8. Move Logout to Settings
- Remove Logout button from TopBar
- Add Logout as a section/button at the bottom of the Settings page
- Settings page should show: Appearance, Chat, Logout section (with confirmation)

### 9. Summary of File Changes Expected
- `app/frontend/styles/app.css` — font sizes
- `app/frontend/layouts/AppLayout.tsx` — clear selection on URL change, remove max-width
- `app/frontend/components/topbar/TopBar.tsx` — remove logout, clear selection on nav click
- `app/frontend/components/sidebar/Sidebar.tsx` — new structure (agents + crons nav + sessions nav)
- `app/frontend/components/sidebar/AgentList.tsx` — indented sub-agents, context bars
- `app/frontend/components/sidebar/CronList.tsx` — clickable nav item with stats
- `app/frontend/components/sidebar/SessionList.tsx` — clickable nav item with stats
- `app/frontend/components/detail/DetailPanel.tsx` — handle cron-list and session-list views
- `app/frontend/components/detail/CronDetail.tsx` — full cron detail view
- `app/frontend/components/detail/SessionDetail.tsx` — full session detail view
- `app/frontend/pages/settings/index.tsx` — add logout, bump text
- `app/frontend/pages/status/index.tsx` — full width, bump text
- `app/frontend/pages/home/index.tsx` — help card title changes, bump text
- `app/frontend/components/status/*.tsx` — help buttons with rich context
- `app/frontend/components/ui/card.tsx` — text size bumps
- `app/frontend/components/ui/button.tsx` — text size bumps
- Various test files — update text assertions

### 10. Quality Checklist
- [ ] All frontend tests pass (`npx vitest run`)
- [ ] ESLint clean (`npx eslint app/frontend/`)
- [ ] No TypeScript errors
- [ ] Nav works: Chat ↔ Status ↔ Settings switches content reliably
- [ ] Help buttons work in all sections
- [ ] Crons view loads when clicking sidebar
- [ ] Sessions view loads when clicking sidebar
- [ ] Sub-agents visually indented under main agent
- [ ] Context % bars visible on agents
- [ ] Mobile still usable (14px+ base font)
- [ ] Commit and push to `agent-visibility` branch on origin
- [ ] Deploy to production: `git push dokku agent-visibility:main`
