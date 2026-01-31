# Agentic Cards — Dashboard as Control Surface

## Vision
Dashbot becomes a lightweight agentic interface where your AI agent can push decisions/reviews to you and receive structured responses back.

## Flow
1. Agent needs you to review/decide something
2. Agent sends a notification: "New item in your dashboard"
3. You open dashbot, see an actionable card
4. You click an action (Yes/No, Approve/Reject, etc.)
5. Card action triggers a **system event** back to the agent (NOT a chat message)
6. Agent processes the response, can send follow-up cards if needed
7. Loop continues until resolved

## Key Design Decisions
- **Card actions → system events**, not chat messages. The agent receives structured callbacks.
- **Notifications as a separate layer** — "check your dashboard" pings via Telegram, SMS, etc.
- **Cards are the interaction unit** — each card is a discrete decision/review
- **Follow-up cards** — agent can chain multiple cards for multi-step workflows
- **Keep it simple** — start with confirm (yes/no) cards, expand later

## Card Types (start simple)
- **Confirm** — Yes/No decisions (approve email, deploy, etc.)
- Future: Select (pick from options), Form (structured input), Preview (review content)

## Architecture
```
Agent → POST card to dashbot API → Card renders in dashboard
User clicks action → POST to dashbot API → Plugin forwards as system event to agent
Agent processes → Optional follow-up card
```

## Implementation Plan

### Phase 1: Card Action Callbacks (branch: agentic-cards)
- [ ] POST /api/cards/:id/respond endpoint (token auth)
- [ ] Card actions POST to this endpoint instead of sending chat messages
- [ ] Plugin receives callback via ActionCable or polling
- [ ] Plugin injects response as system event into OpenClaw session
- [ ] Frontend: disable card after response, show selected state

### Phase 2: Agent → Dashboard Card Push
- [ ] POST /api/cards endpoint for creating cards (used by plugin)
- [ ] Cards rendered in chat feed with metadata
- [ ] Agent can push cards from any session (main, cron, subagent)

### Phase 3: Notifications
- [ ] When a new card is pushed, agent sends a notification: "New item in your dashboard"
- [ ] Configurable notification preferences

## Future Settings Panel Items
- **Communication style**: emoji reactions on/off, message batching (queue & summarize)
- **Memory management**: auto-save frequency (minutes/hours/days/weeks), compression schedule
- **Memory summaries**: daily/weekly/monthly auto-summaries with review cards
- **Notification preferences**: what triggers a ping
- **Agent personality**: verbosity, formality, proactive level

## Branch
`agentic-cards` (off main)
