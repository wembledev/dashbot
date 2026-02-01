# Agent Visibility Spec - DashBot Dashboard

**Created:** 2026-02-01 04:20 AM PST  
**Context:** Mike needs to understand the OpenClaw agent architecture visually and see what's happening in real-time.

---

## Problem

Currently the Agent Status widget shows sessions but:
- Can't tell what each session is doing
- Can't see relationship between main agent, sub-agents, and sessions
- No visibility into when sub-agents are spawned or completed
- Unclear which sessions are safe to close
- Black box - Mike can't see "Garbo just spawned 3 opus agents to work on X, Y, Z"

## Solution: Visual Agent Hierarchy + Activity Log

### 1. Agent Hierarchy View

**Visual tree showing:**
```
┌─────────────────────────────────────────────────────┐
│ Main Agent                                          │
│ Model: claude-sonnet-4-5 (router/orchestrator)    │
│ Status: Running | Last Active: 2m ago              │
│                                                     │
│ ┌─ Sub-agents (3 active)                          │
│ │                                                  │
│ │  ● seed-tasks                                   │
│ │    Model: opus | Status: Completed              │
│ │    Task: Populate Tasks board with TODO.md data │
│ │    Spawned: 03:43 | Completed: 03:48 (5m)      │
│ │    Result: PR #6 created, 34 tasks seeded      │
│ │                                                  │
│ │  ● enhance-agent-status                         │
│ │    Model: opus | Status: Running                │
│ │    Task: Build session management + Car mode    │
│ │    Spawned: 04:15 | Running for: 5m             │
│ │                                                  │
│ │  ● pm-system-research                           │
│ │    Model: opus | Status: Running                │
│ │    Task: Spec AI project management system     │
│ │    Spawned: 03:56 | Running for: 24m            │
│ │                                                  │
│ └─ Sessions (linked to agents)                    │
│                                                    │
│    Main Sessions:                                  │
│    • agent:main:main (this session)               │
│    • agent:main:dashbot:default (chat)            │
│                                                    │
│    Sub-agent Sessions:                             │
│    • agent:main:subagent:5fa90643... (enhance)    │
│    • agent:main:subagent:98e37dee... (research)   │
│                                                    │
│    Cron Sessions:                                  │
│    • agent:main:cron:1c16e377... (Morning brief)  │
│    • agent:main:cron:52f7933e... (Midday check)   │
│    • agent:main:cron:55e21589... (Evening wrap)   │
└─────────────────────────────────────────────────────┘
```

**Key elements:**
- **Main Agent card** at top (always present)
  - Shows model (sonnet for routing)
  - Running status + last active time
  - Link to its sessions
  
- **Sub-agents list** (expandable)
  - Label (from sessions_spawn task name)
  - Model (opus/sonnet/haiku)
  - Status (running, completed, failed, timeout)
  - What it's doing (task description)
  - Spawned time + duration
  - Result/output when completed
  - Link to its session

- **Sessions list** (grouped by type)
  - Type badge (Main, Sub-agent, Cron, DashBot)
  - Description (human-readable, not session key)
  - Status (active, idle, closed)
  - Close button (if safe to close)

### 2. Live Activity Log

**Real-time feed of agent events:**
```
┌─────────────────────────────────────────┐
│ Agent Activity                          │
├─────────────────────────────────────────┤
│ 04:20 Spawned: enhance-agent-status    │
│       ├─ Model: opus                   │
│       └─ Task: Session management UI   │
│                                         │
│ 04:15 Completed: seed-tasks            │
│       ├─ Duration: 5m 20s              │
│       └─ Result: PR #6 created         │
│                                         │
│ 03:56 Spawned: pm-system-research      │
│       ├─ Model: opus                   │
│       └─ Task: Spec AI PM system       │
│                                         │
│ 03:43 Spawned: seed-tasks              │
│       └─ Task: Populate tasks board    │
│                                         │
│ 03:30 Cron: Morning briefing           │
│       └─ Status: Completed (12s)       │
└─────────────────────────────────────────┘
```

**Events to log:**
- Sub-agent spawned (with label, model, task)
- Sub-agent completed (with duration, result)
- Sub-agent failed/timeout (with error)
- Cron executed (with name, duration)
- Main agent model changed
- Sessions opened/closed

**Storage:**
- Store events in database (new `agent_events` table)
- Stream via ActionCable to dashboard
- Keep last 100 events, archive older

### 3. Session Details (Click to Expand)

When clicking a session, show:
- **Session key** (technical ID)
- **Type**: Main / Sub-agent / Cron / DashBot
- **Description**: Human-readable what it's doing
- **Model**: Which model is running
- **Token usage**: Input/output/cache stats
- **Started**: When it started
- **Last activity**: When it last did something
- **Parent**: Which agent spawned it (if sub-agent)
- **Close button**: With safety check
  - ✅ Safe to close: Completed crons, idle chats
  - ⚠️ Will interrupt work: Active sub-agents
  - 🚫 Don't close: Main session

### 4. Mobile/Desktop Optimization

**Mobile-first design:**
- Cards stack vertically on phone
- Collapsible sections (tap to expand sub-agents, sessions)
- Larger touch targets (48px min)
- Readable text (16px+ body, 14px+ labels)

**Desktop enhancements:**
- Side-by-side layout (hierarchy on left, activity log on right)
- More details visible without expanding
- Hover states for interactions

### 5. Car Mode Toggle

**Settings toggle for simplified UI:**
- Larger text (20px+ body, 18px+ labels)
- Bigger buttons (64px min touch targets)
- Higher contrast (black text on white, no grays)
- Fewer details (hide session keys, token counts)
- Simplified status (Running/Idle only, no timestamps)
- Bigger agent cards, less dense layout

**Saved to localStorage:** `dashbot_car_mode = true/false`

---

## Data Model

### New Table: `agent_events`
```ruby
create_table :agent_events do |t|
  t.string :event_type, null: false  # spawned, completed, failed, cron_run
  t.string :agent_label             # e.g. "seed-tasks"
  t.string :session_key             # OpenClaw session key
  t.string :model                   # opus, sonnet, haiku
  t.text :description               # Human-readable task
  t.json :metadata                  # Flexible: result, error, duration, etc
  t.timestamps
end

add_index :agent_events, :event_type
add_index :agent_events, :created_at
```

### API Endpoints

**GET /api/agent/status** (existing, enhance)
- Add sub-agents list
- Add session type labels
- Add safe-to-close flags

**GET /api/agent/events** (new)
- Returns recent agent events (last 100)
- Paginated, sorted by created_at DESC
- Real-time updates via ActionCable

**DELETE /api/sessions/:session_key** (new)
- Kill a session (with safety check)
- Returns success/error + impact message

### ActionCable Channels

**AgentEventsChannel** (new)
- Subscribe to agent event stream
- Broadcasts when sub-agents spawn/complete
- Broadcasts when crons run
- Frontend updates activity log in real-time

**AgentStatusChannel** (enhance existing)
- Add sub-agent status updates
- Add session open/close events

---

## UI Components

### AgentHierarchyWidget (new)
- Shows main agent + sub-agents tree
- Expandable/collapsible sections
- Links to session details

### AgentActivityLog (new)
- Real-time feed of events
- Auto-scrolls to latest
- Click event to see details

### SessionCard (enhance existing)
- Add type badge
- Add description field
- Add close button with safety check

### CarModeToggle (new)
- Settings menu item
- Persists to localStorage
- Applies CSS classes to dashboard

---

## Implementation Phases

### Phase 1: Data + API (4h)
- Create `agent_events` table + migration
- Add `POST /api/agent/events` endpoint (for Garbo to log events)
- Add `GET /api/agent/events` endpoint (for UI to fetch)
- Add `DELETE /api/sessions/:key` endpoint (for session management)
- Update `GET /api/agent/status` to include sub-agents

### Phase 2: Activity Log (3h)
- Create AgentEventsChannel (ActionCable)
- Build AgentActivityLog component (React)
- Add to Status page or new Agent page
- Real-time updates working

### Phase 3: Visual Hierarchy (4h)
- Build AgentHierarchyWidget component
- Tree view with main → sub-agents → sessions
- Expandable sections
- Link everything together

### Phase 4: Session Management (2h)
- Enhance SessionCard with type badges
- Add close button with safety logic
- Modal confirmation for close

### Phase 5: Mobile + Car Mode (2h)
- Mobile-first responsive design
- Car mode toggle in settings
- CSS classes for car mode
- Test on phone + Tesla browser

**Total: ~15 hours**

---

## Example Use Cases

### Use Case 1: "What's Garbo doing right now?"
Mike opens DashBot → sees Agent Hierarchy:
- Main agent running (sonnet, router)
- 2 sub-agents active (enhance-agent-status, pm-system-research)
- 1 sub-agent completed (seed-tasks)

Clicks sub-agent → sees task description, model, duration

### Use Case 2: "Why so many sessions?"
Mike sees Sessions list grouped by type:
- Main (2): This chat + DashBot chat
- Sub-agents (2): Active builds
- Cron (5): Scheduled jobs that ran today

Clicks Cron session → sees "Morning briefing - Completed 7:00 AM (12s)" → Safe to close ✅

### Use Case 3: "Garbo just spawned something"
Activity log shows:
- "04:20 - Spawned: enhance-agent-status (opus) to build session management"

Mike sees it in real-time, knows what's happening

### Use Case 4: "Kill that stuck sub-agent"
Mike clicks sub-agent that's been running 2 hours → clicks Close → confirmation:
- ⚠️ "This will interrupt active work on 'pm-system-research'. The agent will not complete its task. Continue?"
- [Cancel] [Close Session]

---

## Open Questions

1. **How does Garbo log events to agent_events?**
   - POST to /api/agent/events when spawning/completing sub-agents
   - Automatic from sessions_spawn tool?
   - Manual logging in workflows?

2. **Session timeout handling:**
   - Should UI show timeout state?
   - Auto-restart option?
   - Show last error message?

3. **Historical data:**
   - Keep events for how long? (7 days? 30 days?)
   - Archive or delete old events?
   - Pagination for long history?

4. **Permissions:**
   - Only Mike can close sessions?
   - Or any authenticated user?
   - Block closing main session?

---

## Notes for Sub-Agents

If you're picking up this spec after a timeout or restart:

1. **Read this entire document first** - understand the full vision
2. **Check existing code** - some pieces may already exist (AgentStatusWidget, ActionCable setup)
3. **Start with Phase 1** - data model and API endpoints are foundation
4. **Test as you go** - verify each phase works before moving to next
5. **Mobile-first** - design for phone/desktop, not just Tesla browser
6. **PR + deploy** - create branch, PR, deploy to production, DON'T merge
7. **Document** - update this spec if you find issues or make changes

**Current state of dashbot repo:**
- Main reset to cfd142c (pre-tasks feature)
- All new work must be in branches + PRs
- No merging without Mike's approval

**Tech stack:**
- Rails 8.1, Inertia.js, React, TypeScript, Tailwind, ActionCable
- Follow existing patterns (look at AgentStatusWidget, StatusController, StatusChannel)

**Key files to reference:**
- `app/frontend/components/status/agent-status-widget.tsx` (existing widget)
- `app/controllers/api/status_controller.rb` (existing status API)
- `app/channels/status_channel.rb` (existing real-time updates)
- `app/frontend/pages/status/index.tsx` (status page layout)

Good luck! 👾
