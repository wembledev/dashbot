# DashBot SPA Agent Dashboard — Spec

**Created:** 2026-02-01 08:35 AM PST
**Inspired by:** @thekitze OpenClaw Admin UI, @one_man_agency Outreach Command dashboard
**Branch:** `spa-dashboard`

---

## Vision

Transform DashBot from page-based navigation into a **single-page application** with a persistent sidebar showing agents/sub-agents at a glance. Desktop-first, mobile-responsive. The sidebar is the command center — always visible, always showing what's happening.

## Reference Screenshots

### @thekitze (OpenClaw Admin)
- Left sidebar: List of 8 agents with avatars, names, skill counts
- Top nav: Agents / Skills / Channels / Cron / Config tabs
- Main panel: Selected agent detail with sub-tabs (Soul, User, Agents, Memory)
- Dark theme, clean typography

### @one_man_agency (Outreach Command)
- Left sidebar: 4 agents with status badges (● WORKING)
- Top bar: Key metrics (agents active, emails sent, replies)
- Main content: Kanban board
- Dark industrial theme with timestamps

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  🤖 DashBot                    [metrics]    [⚙️] [👤]   │
├──────────┬───────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT                                │
│          │                                               │
│ ┌──────┐ │  (changes based on sidebar selection          │
│ │AGENTS│ │   or top nav)                                 │
│ │      │ │                                               │
│ │ Main │ │  Views:                                       │
│ │  ● ↻ │ │  - Dashboard (home/overview)                  │
│ │      │ │  - Status (agent detail)                      │
│ │ Sub1 │ │  - Tasks (kanban/list)                        │
│ │  ● ✓ │ │  - Chat (conversation)                       │
│ │      │ │  - Projects (overview)                        │
│ │ Sub2 │ │  - Settings                                   │
│ │  ● ⏳│ │                                               │
│ │      │ │                                               │
│ ├──────┤ │                                               │
│ │CRONS │ │                                               │
│ │      │ │                                               │
│ │ 7AM  │ │                                               │
│ │ 12PM │ │                                               │
│ │ 6PM  │ │                                               │
│ └──────┘ │                                               │
├──────────┴───────────────────────────────────────────────┤
│ [Dashboard] [Tasks] [Projects] [Chat] [Settings]        │
└──────────────────────────────────────────────────────────┘
```

## Sidebar (Always Visible on Desktop)

### Agent Section
Each agent shown as a compact card:
```
┌─────────────────────────┐
│ ● Main Agent        ↻   │
│   sonnet · routing      │
├─────────────────────────┤
│ ● spa-dashboard     ⏳  │
│   opus · building SPA   │
├─────────────────────────┤
│ ✓ seed-tasks        ✓   │
│   opus · completed 5m   │
├─────────────────────────┤
│ ✗ pm-research       ✗   │
│   opus · timed out      │
└─────────────────────────┘
```

**Each agent card shows:**
- Status dot: 🟢 running, 🟡 idle, ✅ completed, ❌ failed/timeout
- Label (agent name or task description)
- Model (sonnet/opus/haiku)
- What it's doing (1-line description)
- Duration or time since last active

**Clicking an agent** → Main panel shows that agent's detail (session info, activity, token usage)

### Cron Section (collapsible)
```
┌─────────────────────────┐
│ CRONS (6)           ▾   │
│ 7:00 AM  Morning brief  │
│ 12:00 PM Midday check   │
│ 6:00 PM  Evening wrap   │
│ ...                      │
└─────────────────────────┘
```

### Sessions Section (collapsible)
```
┌─────────────────────────┐
│ SESSIONS (4)        ▾   │
│ 🟢 Main (this)          │
│ 🟢 DashBot chat         │
│ 🟡 Telegram             │
│ 🔴 Cron: 7AM brief      │
└─────────────────────────┘
```

## Top Bar

```
🤖 DashBot          [3 agents] [12 tasks] [2 alerts]     ⚙️  👤
```

- Logo + name (left)
- Quick metrics (center) — agent count, active tasks, alerts
- Settings + profile (right)

## Main Content Views

### 1. Dashboard (Home)
Overview with key widgets:
- Agent activity feed (recent spawns, completions)
- Task summary (needs input count, in progress)
- Quick stats (sessions, uptime, model usage)
- Recent chat messages

### 2. Agent Detail (click agent in sidebar)
- Agent info (model, status, task, session key)
- Activity timeline for this agent
- Token usage (input/output/cache)
- Session history
- Close/restart button

### 3. Tasks
- Current tasks page (keep existing, enhance with SPA navigation)
- Filter by project, status, priority

### 4. Chat
- Current chat interface
- Keep as-is but within SPA shell

### 5. Projects
- Current projects page within SPA shell

### 6. Settings
- Current settings within SPA shell
- Car mode toggle stays

## SPA Architecture (Inertia.js)

DashBot already uses **Inertia.js** — which is designed for exactly this. We need:

### 1. Persistent Layout Component
```tsx
// app/frontend/layouts/AppLayout.tsx
export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 2. Inertia Persistent Layouts
Inertia supports persistent layouts that don't unmount between page visits:
```tsx
// In each page component:
Dashboard.layout = (page) => <AppLayout>{page}</AppLayout>
```
This means the sidebar stays mounted (preserving WebSocket connections, scroll position, etc.) while the main content swaps.

### 3. Sidebar Component
```tsx
// app/frontend/components/sidebar/Sidebar.tsx
export function Sidebar() {
  // Fetch agent/session data via ActionCable (real-time)
  // Or poll /api/status every 10s
  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col">
      <SidebarHeader />
      <AgentList />
      <CronList />
      <SessionList />
      <SidebarNav />
    </aside>
  )
}
```

### 4. Real-time Agent Data
The sidebar needs live agent/session data. Options:
- **ActionCable** (already in use) — Subscribe to `AgentStatusChannel`
- **Polling** — GET /api/status every 10-15s (simpler, already works)
- **Hybrid** — ActionCable for events, poll for full state

### 5. Navigation
Bottom of sidebar or within sidebar:
```
📊 Dashboard
📋 Tasks
📁 Projects
💬 Chat
⚙️ Settings
```

Use Inertia `<Link>` for SPA navigation (no full page reloads).

## Mobile Layout

On mobile (< 768px):
- Sidebar collapses to a hamburger menu / slide-out drawer
- Bottom tab bar for main navigation (Dashboard, Tasks, Chat, Settings)
- Agent list accessible via top-level "Agents" tab or drawer
- Main content takes full width

```
┌───────────────────────┐
│ 🤖 DashBot    ☰  ⚙️  │
├───────────────────────┤
│                       │
│  MAIN CONTENT         │
│  (full width)         │
│                       │
│                       │
├───────────────────────┤
│ 📊  📋  🤖  💬  ⚙️   │
│Home Task Agent Chat Set│
└───────────────────────┘
```

## Data Requirements

### Sidebar Agent Data (GET /api/status — enhance existing)
```json
{
  "main_agent": {
    "model": "sonnet",
    "status": "running",
    "last_active": "2m ago"
  },
  "sub_agents": [
    {
      "label": "spa-dashboard",
      "model": "opus",
      "status": "running",
      "task": "Building SPA layout",
      "started_at": "08:35",
      "duration": "12m"
    }
  ],
  "sessions": [
    {
      "key": "agent:main:main",
      "type": "main",
      "label": "Main Session",
      "status": "active"
    }
  ],
  "crons": [
    {
      "name": "Morning briefing",
      "schedule": "7:00 AM",
      "last_run": "today 7:00 AM",
      "next_run": "tomorrow 7:00 AM"
    }
  ]
}
```

### Real-time Updates
ActionCable channels:
- `AgentEventsChannel` (already exists) — spawn/complete/fail events
- `StatusChannel` (already exists) — general status updates

## Implementation Phases

### Phase 1: SPA Shell (2-3 hours)
- Create `AppLayout.tsx` with sidebar + main content area
- Move existing nav into sidebar bottom section
- Set persistent layout on all pages
- Dark theme (zinc-950 background, zinc-800 borders)
- Verify Inertia SPA navigation works (no reloads)

### Phase 2: Sidebar Agent List (2-3 hours)
- Fetch agent/session data for sidebar
- Agent cards with status, model, task
- Cron list (collapsible)
- Session list (collapsible)
- Real-time updates via ActionCable or polling
- Click agent → navigate to agent detail view

### Phase 3: Top Bar + Metrics (1 hour)
- Logo, quick metrics, settings/profile
- Responsive (collapse metrics on mobile)

### Phase 4: Mobile Responsive (1-2 hours)
- Sidebar → drawer on mobile
- Bottom tab bar navigation
- Touch-optimized spacing

### Phase 5: Polish (1-2 hours)
- Transitions between views
- Loading states
- Empty states
- Car mode integration with new layout

## Design System

### Colors (Dark Theme)
- Background: `zinc-950` (#09090b)
- Surface: `zinc-900` (#18181b)
- Border: `zinc-800` (#27272a)
- Text primary: `zinc-100` (#f4f4f5)
- Text secondary: `zinc-400` (#a1a1aa)
- Accent: `blue-500` (#3b82f6)
- Success: `emerald-500` (#10b981)
- Warning: `amber-500` (#f59e0b)
- Error: `red-500` (#ef4444)

### Typography
- Headers: `font-semibold text-zinc-100`
- Body: `text-sm text-zinc-300`
- Labels: `text-xs text-zinc-500 uppercase tracking-wider`
- Monospace for technical data: `font-mono text-xs`

### Spacing
- Sidebar width: `w-64` (256px)
- Content padding: `p-6`
- Card padding: `p-3`
- Gap between items: `gap-2` or `gap-3`

## Files to Create/Modify

### New Files
- `app/frontend/layouts/AppLayout.tsx` — Main SPA layout
- `app/frontend/components/sidebar/Sidebar.tsx` — Sidebar container
- `app/frontend/components/sidebar/AgentList.tsx` — Agent cards
- `app/frontend/components/sidebar/CronList.tsx` — Cron jobs list
- `app/frontend/components/sidebar/SessionList.tsx` — Sessions list
- `app/frontend/components/sidebar/SidebarNav.tsx` — Navigation links
- `app/frontend/components/topbar/TopBar.tsx` — Top metrics bar
- `app/frontend/hooks/useAgentData.ts` — Shared hook for agent/session data

### Modified Files
- `app/frontend/pages/*/index.tsx` — Add `.layout = AppLayout` to all pages
- `app/frontend/styles/app.css` — Add sidebar + SPA styles
- `app/controllers/status_controller.rb` — Enhance API response for sidebar data

## Key Principle

**The sidebar is the birds-eye view.** At a glance, Mike should see:
- How many agents are running
- What each is doing
- Which need attention
- System health

Everything else is one click away in the main panel.
