# DashBot Final Tweaks — agent-visibility branch

## Branch
`agent-visibility` — commit and push directly. Deploy with `git push dokku agent-visibility:main`.

## Changes Required

### 1. Session Health Widget — Friendly Labels
Instead of showing full session keys like `agent:main:cron:9d6fbccc-41c2-4...`, show human-readable labels:
- `agent:main:main` → **Main**
- `agent:main:dashbot:*` → **DashBot**
- `dashbot:*` → **DashBot Chat**
- `agent:main:cron:*` → **Cron**
- `agent:main:subagent:*` → **Sub-agent**
- `agent:main:channel:*` → **Channel**

The `parseSessionType` function in `app/frontend/lib/sessions.ts` already does this mapping. Use it (or a similar helper) in the Session Health widget (`app/frontend/components/status/session-health-widget.tsx`) to display the friendly label instead of the raw key.

### 2. Live Token Burn — Show ALL Sessions
Currently shows only main session tokens. Should show token burn across ALL active sessions:
- List each session with label + tokens + context %
- Or show aggregate total across all sessions
- At minimum: main session, dashbot session, cron sessions (grouped), sub-agent sessions
- Use the same friendly labels from #1

File: `app/frontend/components/status/token-burn-widget.tsx`

### 3. Sidebar: Crons & Sessions at TOP (not bottom)
Move Crons and Sessions nav items from the bottom of the sidebar to right after the Agents section:

```
AGENTS
  Main Agent (with context bar)
    ↳ sub-agent (indented)

CRONS          10 jobs · 2 errors
SESSIONS       17 total · 3 active
```

Not at the very bottom where you have to scroll. They should be primary navigation items.

File: `app/frontend/components/sidebar/Sidebar.tsx`

### 4. Chat Page — Full Screen, No Sidebar
When on Chat (`/dashboard`), hide the sidebar entirely. Chat should take up the full browser width. The top bar nav (Chat/Status/Settings) stays for switching.

Approach: In `AppLayout.tsx`, check if the current page is Chat (`isChat` flag already exists). If so, don't render the sidebar.

### 5. Settings Page — Full Screen, No Sidebar  
Same as Chat — when on Settings (`/settings`), hide the sidebar. Settings content takes full width. Could use its own internal nav for settings sections (Appearance, Chat, Models, Memory, Notifications — like tabs within the settings page).

### 6. Contextual Help — Slide-in Chat Panel (KEY FEATURE)
**Instead of navigating to the full Chat page when clicking help:**
- Show a slide-in panel from the right side (like a drawer/sheet)
- Width: ~400px on desktop, full width on mobile
- Contains a mini chat interface (just the help conversation)
- User stays on the current page (Status, Crons, Sessions) while seeing help
- Panel slides in with animation (transform translateX, 200-300ms ease)
- Close button (X) or click outside to dismiss
- The help message is sent to the same chat session via the existing WebSocket

**Implementation approach:**
1. Create a new `HelpDrawer` component (or `ChatDrawer`):
   - Fixed position, right side, full height
   - Semi-transparent backdrop
   - Contains: header (title from help context), chat messages (filtered to help), input for follow-up questions
   - Slide animation via CSS transition on `translateX`
2. Create a `HelpDrawerContext` (or add to existing context):
   - `openHelp(topic: string, context: string)` — opens drawer, sends message
   - `closeHelp()` — closes drawer  
   - `isOpen`, `topic` state
3. In `AppLayout.tsx`, render `<HelpDrawer />` at the root level
4. Help buttons call `openHelp()` instead of navigating to `/dashboard`
5. The drawer sends the help message via the existing chat WebSocket/API and displays the response

**The help message flow:**
- User clicks help button on Token Burn widget
- Drawer slides in from right with title "About Token Usage"
- Message sent to backend: rich context about current token values
- Response streams into the drawer
- User can close drawer and continue on Status page

File: new `app/frontend/components/help/HelpDrawer.tsx`, new context, update AppLayout

### 7. Quality Checklist
- [ ] All frontend tests pass (`npx vitest run`) — update assertions as needed
- [ ] ESLint clean (`npx eslint app/frontend/`)
- [ ] Nav still works: Chat ↔ Status ↔ Settings
- [ ] Help drawer slides in and shows response without leaving current page
- [ ] Chat is full-width (no sidebar)
- [ ] Settings is full-width (no sidebar)
- [ ] Sidebar shows Crons/Sessions right after Agents
- [ ] Session Health shows friendly labels
- [ ] Token Burn shows all sessions
- [ ] Commit, push to origin, deploy to production
