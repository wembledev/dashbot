import type { SessionInfo, ParsedSession, SessionType, SessionStatus, SessionSafety } from '@/types/status'

const KNOWN_CHANNEL_SEGMENTS = new Set([
  'discord',
  'telegram',
  'signal',
  'imessage',
  'whatsapp',
  'slack',
  'webchat',
  'irc',
  'googlechat',
  'zalo',
  'sms',
])

type SessionInput = string | SessionInfo

function asSession(input: SessionInput): SessionInfo {
  if (typeof input === 'string') {
    return {
      key: input,
      kind: '',
      model: 'unknown',
      tokens: '0/0',
      context_percent: 0,
      age: 'unknown',
      flags: '',
    }
  }
  return input
}

function keyParts(key: string): string[] {
  return key.split(':').filter(Boolean)
}

function inferChannelName(key: string): string | null {
  const parts = keyParts(key)
  const lower = parts.map((p) => p.toLowerCase())

  const channelIndex = lower.lastIndexOf('channel')
  if (channelIndex > 0 && KNOWN_CHANNEL_SEGMENTS.has(lower[channelIndex - 1])) {
    return parts[channelIndex - 1]
  }

  if (parts.length >= 3 && KNOWN_CHANNEL_SEGMENTS.has(lower[2])) {
    return parts[2]
  }

  if (lower.includes('dashbot')) return 'dashbot'
  return null
}

/**
 * Parse a session key/session object to determine type.
 * Handles modern OpenClaw formats like:
 * - agent:main:main
 * - agent:main:cron:<id>
 * - agent:main:subagent:<id>
 * - agent:main:discord:channel:<id>
 * - agent:main:dashbot:default
 */
export function parseSessionType(input: SessionInput): SessionType {
  const session = asSession(input)
  const key = session.key || ''
  const kind = (session.kind || '').toLowerCase()
  const chatType = (session.chat_type || '').toLowerCase()

  const parts = keyParts(key)
  const lower = parts.map((p) => p.toLowerCase())
  const keyLower = key.toLowerCase()

  if (keyLower === 'main') return 'main'
  if (kind === 'main') return 'main'
  if (parts[0] === 'agent' && parts.length === 3 && lower[2] === 'main') return 'main'

  if (lower.includes('subagent') || kind === 'subagent') return 'subagent'
  if (lower.includes('cron') || kind === 'cron' || keyLower.startsWith('cron:')) return 'cron'

  if (lower.includes('dashbot') || kind === 'dashbot' || keyLower.includes(':dashbot:')) {
    return 'dashbot'
  }

  if (
    lower.includes('channel') ||
    kind === 'group' ||
    kind === 'channel' ||
    chatType === 'channel' ||
    inferChannelName(key) !== null
  ) {
    return 'channel'
  }

  return 'unknown'
}

function prettifyName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'unknown'

  if (/^[0-9a-f]{8}-[0-9a-f-]+$/i.test(trimmed)) return trimmed.slice(0, 8)
  if (/^\d{8,}$/.test(trimmed)) return trimmed

  return trimmed
    .replace(/^discord:/i, 'Discord: ')
    .replace(/^telegram:/i, 'Telegram: ')
    .replace(/^signal:/i, 'Signal: ')
    .replace(/^imessage:/i, 'iMessage: ')
    .replace(/^dashbot:/i, 'DashBot: ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function lastPart(parts: string[]): string | undefined {
  return parts.length > 0 ? parts[parts.length - 1] : undefined
}

function extractName(session: SessionInfo, type: SessionType): string {
  const displayName = session.display_name?.trim()
  if (displayName) return displayName

  const parts = keyParts(session.key)
  const lower = parts.map((p) => p.toLowerCase())

  switch (type) {
    case 'main':
      return 'main'
    case 'cron': {
      const idx = lower.lastIndexOf('cron')
      if (idx >= 0 && idx + 1 < parts.length) return parts.slice(idx + 1).join(':')
      return lastPart(parts) || session.key
    }
    case 'subagent': {
      const idx = lower.lastIndexOf('subagent')
      if (idx >= 0 && idx + 1 < parts.length) return parts.slice(idx + 1).join(':')
      return lastPart(parts) || session.key
    }
    case 'dashbot': {
      const idx = lower.lastIndexOf('dashbot')
      if (idx >= 0 && idx + 1 < parts.length) return parts.slice(idx + 1).join(':')
      return lastPart(parts) || 'dashbot'
    }
    case 'channel': {
      const idx = lower.lastIndexOf('channel')
      if (idx >= 0 && idx + 1 < parts.length) {
        const provider = idx > 0 ? parts[idx - 1] : null
        const rest = parts.slice(idx + 1).join(':')
        if (provider && KNOWN_CHANNEL_SEGMENTS.has(provider.toLowerCase())) {
          return `${provider}:${rest}`
        }
        return rest
      }
      if (parts.length >= 4) return parts.slice(2).join(':')
      return lastPart(parts) || session.key
    }
    default:
      return lastPart(parts) || session.key
  }
}

/** Generate a human-readable label for a session. */
function generateLabel(session: SessionInfo, type: SessionType): string {
  const name = extractName(session, type)

  switch (type) {
    case 'main':
      return 'Main: Router session'
    case 'cron':
      return `Cron: ${prettifyName(name)}`
    case 'subagent': {
      const shortId = name.length > 12 ? name.slice(0, 8) : name
      return `Sub-agent: ${shortId}`
    }
    case 'dashbot':
      return 'DashBot: Dashboard session'
    case 'channel':
      return `Channel: ${prettifyName(name)}`
    default:
      return `Session: ${prettifyName(name)}`
  }
}

/** Generate a short description of what the session does. */
function generateDescription(type: SessionType): string {
  switch (type) {
    case 'main': return 'Routes messages and manages sub-agents'
    case 'cron': return 'Scheduled task — runs independently, results saved for main agent'
    case 'subagent': return 'Background task spawned by main agent'
    case 'dashbot': return 'DashBot dashboard session'
    case 'channel': return 'External messaging channel session'
    default: return 'Agent session'
  }
}

/** Determine session status based on context usage and age. */
function inferStatus(session: SessionInfo, type: SessionType): SessionStatus {
  if (type === 'cron' && session.context_percent < 5) return 'completed'
  if (session.context_percent > 95) return 'failed'

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
  if (status === 'completed' || status === 'idle') {
    return { safety: 'safe', reason: 'Completed/idle — safe to close' }
  }
  if (type === 'cron') {
    return { safety: 'safe', reason: 'Cron session — works independently' }
  }
  if (type === 'dashbot' || type === 'channel') {
    return { safety: 'caution', reason: 'Channel session — closing ends the conversation' }
  }
  return { safety: 'caution', reason: 'Active session — may interrupt work' }
}

/** Short friendly label for a session key/session object. */
export function friendlySessionLabel(input: SessionInput): string {
  const session = asSession(input)
  const type = parseSessionType(session)

  switch (type) {
    case 'main': return 'Main'
    case 'dashbot': return 'DashBot'
    case 'cron': return 'Cron'
    case 'subagent': return 'Sub-agent'
    case 'channel': {
      const channelName = inferChannelName(session.key)
      return channelName ? prettifyName(channelName) : 'Channel'
    }
    default: return 'Session'
  }
}

/** Parse a raw SessionInfo into a fully classified ParsedSession. */
export function parseSession(session: SessionInfo): ParsedSession {
  const type = parseSessionType(session)
  const status = inferStatus(session, type)
  const { safety, reason } = classifySafety(type, status)

  return {
    ...session,
    type,
    label: generateLabel(session, type),
    description: generateDescription(type),
    status,
    safety,
    safetyReason: reason,
    parentKey: type === 'subagent' ? session.key.replace(/subagent:.*$/, 'main') : undefined,
  }
}

/** Parse all sessions and sort by type hierarchy: main → subagents → channels → crons. */
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
