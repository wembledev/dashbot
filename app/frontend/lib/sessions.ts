import type { SessionInfo, ParsedSession, SessionType, SessionStatus, SessionSafety } from '@/types/status'

/**
 * Parse a session key to determine its type and generate human-readable labels.
 *
 * Session key formats from OpenClaw:
 *   agent:main:main               → Main router session
 *   agent:main:cron:<name>        → Cron job session
 *   agent:main:subagent:<id>      → Sub-agent session
 *   agent:main:channel:<name>     → Channel session (dashbot, discord, etc.)
 *   agent:<name>:*                → Other agent sessions
 */
export function parseSessionType(key: string): SessionType {
  if (/agent:\w+:main$/.test(key)) return 'main'
  if (/agent:\w+:cron:/.test(key)) return 'cron'
  if (/agent:\w+:subagent:/.test(key)) return 'subagent'
  if (/agent:\w+:channel:dashbot/.test(key)) return 'dashbot'
  if (/agent:\w+:channel:/.test(key)) return 'channel'
  return 'unknown'
}

/** Extract the human-readable name from a session key. */
function extractName(key: string): string {
  const parts = key.split(':')
  // Last meaningful part is usually the name/id
  if (parts.length >= 4) return parts.slice(3).join(':')
  if (parts.length >= 3) return parts[2]
  return key
}

/** Prettify a cron job name (kebab-case → Title Case). */
function prettifyCronName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Generate a human-readable label for a session. */
function generateLabel(type: SessionType, key: string): string {
  const name = extractName(key)
  switch (type) {
    case 'main': return 'Main: Router session'
    case 'cron': return `Cron: ${prettifyCronName(name)}`
    case 'subagent': {
      // Sub-agent IDs are UUIDs; shorten them
      const shortId = name.length > 12 ? name.slice(0, 8) : name
      return `Sub-agent: ${shortId}`
    }
    case 'dashbot': return 'DashBot: Chat session'
    case 'channel': return `Channel: ${prettifyCronName(name)}`
    default: return `Session: ${name}`
  }
}

/** Generate a short description of what the session does. */
function generateDescription(type: SessionType): string {
  switch (type) {
    case 'main': return 'Routes messages and manages sub-agents'
    case 'cron': return 'Scheduled task — runs independently, results saved for main agent'
    case 'subagent': return 'Background task spawned by main agent'
    case 'dashbot': return 'Web chat interface session'
    case 'channel': return 'External messaging channel'
    default: return 'Agent session'
  }
}

/** Determine session status based on context usage and age. */
function inferStatus(session: SessionInfo, type: SessionType): SessionStatus {
  // Cron jobs with low context are likely completed
  if (type === 'cron' && session.context_percent < 5) return 'completed'
  // Sessions with very high context might be stale/failed
  if (session.context_percent > 95) return 'failed'
  // If age suggests inactivity (e.g., "3h ago" or more)
  const ageMatch = session.age.match(/(\d+)([hmd])/)
  if (ageMatch) {
    const value = parseInt(ageMatch[1])
    const unit = ageMatch[2]
    if (unit === 'h' && value >= 2) return 'idle'
    if (unit === 'd') return 'idle'
  }
  return 'active'
}

/** Determine if it's safe to close this session. */
function classifySafety(type: SessionType, status: SessionStatus): { safety: SessionSafety; reason: string } {
  if (type === 'main') {
    return { safety: 'unsafe', reason: 'Main session — closing stops all agent functions' }
  }
  if (type === 'subagent' && status === 'active') {
    return { safety: 'caution', reason: 'Active sub-agent — closing will interrupt current work' }
  }
  if (status === 'completed') {
    return { safety: 'safe', reason: 'Completed — safe to close' }
  }
  if (status === 'idle') {
    return { safety: 'safe', reason: 'Idle — safe to close' }
  }
  if (type === 'cron') {
    return { safety: 'safe', reason: 'Cron session — works independently' }
  }
  if (type === 'dashbot' || type === 'channel') {
    return { safety: 'caution', reason: 'Channel session — closing ends the conversation' }
  }
  return { safety: 'caution', reason: 'Active session — may interrupt work' }
}

/** Short friendly label for a session key (e.g., "Main", "DashBot", "Cron"). */
export function friendlySessionLabel(key: string): string {
  const type = parseSessionType(key)
  switch (type) {
    case 'main': return 'Main'
    case 'dashbot': return 'DashBot'
    case 'cron': return 'Cron'
    case 'subagent': return 'Sub-agent'
    case 'channel': return 'Channel'
    default: return 'Session'
  }
}

/** Parse a raw SessionInfo into a fully classified ParsedSession. */
export function parseSession(session: SessionInfo): ParsedSession {
  const type = parseSessionType(session.key)
  const status = inferStatus(session, type)
  const { safety, reason } = classifySafety(type, status)

  return {
    ...session,
    type,
    label: generateLabel(type, session.key),
    description: generateDescription(type),
    status,
    safety,
    safetyReason: reason,
    parentKey: type === 'subagent' ? session.key.replace(/subagent:.*$/, 'main') : undefined,
  }
}

/** Parse all sessions and sort by type hierarchy: main → subagents → crons → channels. */
export function parseSessions(sessions: SessionInfo[]): ParsedSession[] {
  const ORDER: Record<SessionType, number> = {
    main: 0,
    subagent: 1,
    dashbot: 2,
    channel: 3,
    cron: 4,
    unknown: 5,
  }

  return sessions
    .map(parseSession)
    .sort((a, b) => ORDER[a.type] - ORDER[b.type])
}

/** Group sessions by their parent (main) for hierarchy display. */
export function groupSessionsByParent(sessions: ParsedSession[]): {
  main: ParsedSession | null
  children: ParsedSession[]
} {
  const main = sessions.find(s => s.type === 'main') ?? null
  const children = sessions.filter(s => s.type !== 'main')
  return { main, children }
}
