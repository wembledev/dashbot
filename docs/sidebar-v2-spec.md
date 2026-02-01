# DashBot Sidebar V2 — Redesign Spec

**Date:** 2026-02-01
**Branch:** `agent-visibility` (continue on same branch)
**Status:** Build ready

---

## Key Changes from V1

1. **Content area too wide** → constrain max-width (~900px), center in main area
2. **Move nav (Chat/Status/Settings) to top bar** — only 3 tabs
3. **Left sidebar = data browser** — agents, sub-agents, sessions, crons as clickable items
4. **Each sidebar item → own detail view** in content area
5. **Contextual help (?)** → sends background message to chat, answer appears as styled card
6. **Chat gets tighter** but cards become beautiful for contextual help responses
7. **Pull max data from OpenClaw server** — models, tokens, timing, everything available

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ 🤖 DASHBOT ●    [💬 Chat] [📊 Status] [⚙️ Settings]        │
├────────────┬─────────────────────────────────────────────────┤
│ SIDEBAR    │  CONTENT AREA (max-width ~900px, centered)      │
│ (240-280px)│                                                  │
│            │  Changes based on:                               │
│ AGENTS     │  - Top nav tab (Chat, Status, Settings)          │
│ ┌────────┐ │  - Sidebar item click (agent/session/cron detail)│
│ │● Main  │ │                                                  │
│ │  opus  │ │                                                  │
│ │  8m ago│ │                                                  │
│ ├────────┤ │                                                  │
│ │● sub-1 │ │                                                  │
│ │  opus  │ │                                                  │
│ │  build │ │                                                  │
│ └────────┘ │                                                  │
│            │                                                  │
│ CRONS (10) │                                                  │
│ ┌────────┐ │                                                  │
│ │ 7AM ●  │ │                                                  │
│ │ 12PM ● │ │                                                  │
│ │ 6PM    │ │                                                  │
│ └────────┘ │                                                  │
│            │                                                  │
│ SESSIONS   │                                                  │
│ ┌────────┐ │                                                  │
│ │ main 🟢│ │                                                  │
│ │ tg   🟢│ │                                                  │
│ └────────┘ │                                                  │
└────────────┴─────────────────────────────────────────────────┘
```

## Top Bar

```
🤖 DASHBOT ●    [💬 Chat] [📊 Status] [⚙️ Settings]    [Logout]
```

- Left: Logo + connection dot
- Center: 3 nav tabs (Chat, Status, Settings) — pill/tab style
- Right: Logout button (subtle)
- No metrics in top bar (declutter)

## Sidebar — The Data Browser

### Agents Section
Each agent as a compact row:
```
● Main Agent                    🟢
  claude-opus-4-5 · up 8m ago

● spa-dashboard                 ⚡
  opus · Building SPA layout...
```

- Status: 🟢 online, ⚡ running (sub-agent), ✅ done, ❌ failed
- Click → content area shows **Agent Detail View**

### Crons Section (collapsible)
```
CRONS (10)                      ▾
┌─────────────────────────────┐
│ Morning briefing    7:00 AM │
│   ● ran 3h ago              │
│ Midday check       12:00 PM │
│   ○ next in 1h              │
│ Evening wrap        6:00 PM │
│   ○ next in 7h              │
└─────────────────────────────┘
```

Show: name, schedule, last run / next run (simple)
Click → **Cron Detail View**

### Sessions Section (collapsible)
```
SESSIONS (16)    2 active       ▾
┌─────────────────────────────┐
│ 🟢 main                     │
│ 🟢 telegram:mike            │
│ ○  dashbot                   │
│ ○  cron:morning-brief        │
└─────────────────────────────┘
```

Show: status dot, label/key (truncated)
Click → **Session Detail View**

## Content Area Detail Views

### Agent Detail View (click agent in sidebar)
```
┌─────────────────────────────────────────┐
│ Main Agent                    ● Online  │
│                                         │
│ Model: claude-opus-4-5                  │
│ Session: agent:main:main                │
│ Uptime: 8 minutes                       │
│ Last active: 2m ago                     │
│                                         │
│ Token Usage                      [?]    │
│ ┌─────────────────────────────────────┐ │
│ │ Input: 45.2K  Output: 12.1K        │ │
│ │ Cache read: 89.3K  write: 5.2K     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Sub-Agents (1)                          │
│ ┌─────────────────────────────────────┐ │
│ │ ⚡ spa-dashboard (opus)             │ │
│ │   Building SPA layout...           │ │
│ │   Started 12m ago                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Recent Activity                         │
│ • Spawned spa-dashboard (08:35)         │
│ • Session started (08:27)               │
└─────────────────────────────────────────┘
```

### Cron Detail View (click cron in sidebar)
```
┌─────────────────────────────────────────┐
│ Morning Briefing              [▶ Run]   │
│                                         │
│ Schedule: 7:00 AM daily (PST)           │
│ Target: isolated (agentTurn)            │
│ Model: default                          │
│ Enabled: ✅                             │
│                                         │
│ Last Run: Today 7:00 AM                 │
│ Status: ✅ Completed (2m 15s)           │
│ Next Run: Tomorrow 7:00 AM             │
│                                         │
│ Payload:                         [?]    │
│ "Check email, calendar..."              │
└─────────────────────────────────────────┘
```

### Session Detail View (click session in sidebar)
```
┌─────────────────────────────────────────┐
│ Session: telegram:mike        🟢 Active │
│                                         │
│ Kind: channel                           │
│ Channel: telegram                       │
│ Created: 2h ago                         │
│ Messages: 24                            │
│                                         │
│ Model: claude-opus-4-5                  │
│ Thinking: low                           │
│                                         │
│ [Close Session]                         │
└─────────────────────────────────────────┘
```

## Contextual Help System

The `[?]` icon on any widget/section:

1. User clicks `[?]` next to "Token Usage"
2. System builds a help request with context:
   ```
   User wants help understanding Token Usage.
   Context: Main Agent, model=claude-opus-4-5,
   input=45.2K, output=12.1K, cache_read=89.3K
   Explain this in a helpful, concise way.
   ```
3. **Sends as background message** to DashBot chat (POST /api/cards or /api/messages)
4. The response appears in Chat as a **styled help card**:
   ```
   ┌─ 💡 Token Usage Explained ───────────┐
   │                                       │
   │ Your agent has used 45.2K input       │
   │ tokens (what it reads) and 12.1K      │
   │ output tokens (what it writes).       │
   │                                       │
   │ Cache reads (89.3K) mean it's         │
   │ efficiently reusing context from      │
   │ previous turns.                       │
   │                                       │
   │ 💰 Estimated cost: ~$0.12            │
   └───────────────────────────────────────┘
   ```
5. Nav auto-switches to Chat tab to show the response (or shows a toast notification)

## Chat Improvements

Chat content area is now constrained (max-width ~700px within the ~900px content):
- Messages are tighter, more readable
- **Help cards** have a distinct style (blue-ish border, icon header)
- **Agent cards** (road trip cards, etc.) get a subtle card treatment
- Input area stays at bottom, full-width of chat area

## OpenClaw Data Sources

Pull everything available from the API:

### From /api/status (existing + enhance)
- Agent status, model, last heartbeat
- Sub-agents with labels, models, status, tasks
- Session list with kinds, channels, created times
- Token usage (input, output, cache_read, cache_write)

### From /api/sessions (existing)
- Full session list with details
- Message counts, activity

### From cron management endpoints (existing)
- Cron list with schedules, last/next run times
- Run history
- Enable/disable/run controls

### From OpenClaw Gateway (enhance API if needed)
- Model info (which model each session uses)
- Thinking level
- Session configuration
- Channel info

## Implementation Priority

1. **Top bar nav** — move Chat/Status/Settings to top, remove from sidebar
2. **Content max-width** — constrain to ~900px centered
3. **Sidebar as data browser** — agents, crons, sessions as clickable items
4. **Detail views** — agent detail, cron detail, session detail
5. **Contextual help** — [?] buttons that send to chat
6. **Help cards in chat** — styled card responses
7. **Cross-linking** — click a sub-agent in agent detail → jumps to that agent's detail

## Files to Modify

### Frontend
- `app/frontend/layouts/AppLayout.tsx` — restructure: top bar nav, sidebar data, constrained content
- `app/frontend/components/sidebar/Sidebar.tsx` — remove nav, make data browser
- `app/frontend/components/topbar/TopBar.tsx` — add nav tabs
- NEW: `app/frontend/pages/agents/detail.tsx` — agent detail view
- NEW: `app/frontend/pages/crons/detail.tsx` — cron detail view  
- NEW: `app/frontend/pages/sessions/detail.tsx` — session detail view
- `app/frontend/pages/home/index.tsx` — chat page tweaks
- `app/frontend/styles/app.css` — content width constraints, card styles

### Backend
- `app/controllers/status_controller.rb` — enhance data for sidebar
- `config/routes.rb` — add detail view routes if needed
- May need new Inertia props for detail views

## Design Constraints

- **Max content width**: ~900px (centered in available space)
- **Sidebar width**: 240-280px
- **Chat messages**: max-width ~700px within content area
- **Cards**: rounded corners, subtle borders, zinc-800 backgrounds
- **Help cards**: distinct border color (blue/cyan), icon header
- Keep dark theme (zinc-950 base)
