import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { useCarMode } from '@/contexts/car-mode-context'
import {
  Bot, ChevronDown, ChevronRight, X, Info,
  Zap, CheckCircle, XCircle, Pause,
  Network
} from 'lucide-react'
import { parseSessions, groupSessionsByParent } from '@/lib/sessions'
import type { AgentStatusData, SessionInfo, ParsedSession, SessionStatus } from '@/types/status'

interface Props {
  data: AgentStatusData
  sessions: SessionInfo[]
  onCloseSession?: (sessionKey: string) => void
}

const SESSION_STATUS_CONFIG: Record<SessionStatus, { icon: typeof Zap; color: string; label: string }> = {
  active:    { icon: Zap,         color: 'text-green-400',  label: 'Active' },
  idle:      { icon: Pause,       color: 'text-yellow-400', label: 'Idle' },
  completed: { icon: CheckCircle, color: 'text-blue-400',   label: 'Done' },
  failed:    { icon: XCircle,     color: 'text-red-400',    label: 'Failed' },
}

const TYPE_COLORS: Record<string, string> = {
  main:     'border-l-green-500',
  subagent: 'border-l-violet-500',
  dashbot:  'border-l-blue-500',
  channel:  'border-l-cyan-500',
  cron:     'border-l-amber-500',
  unknown:  'border-l-gray-500',
}

// ─── Session row ────────────────────────
function SessionRow({ session, onClose }: { session: ParsedSession; onClose?: (key: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { carMode } = useCarMode()
  const typeColor = TYPE_COLORS[session.type] || TYPE_COLORS.unknown
  const config = SESSION_STATUS_CONFIG[session.status]
  const Icon = config.icon

  return (
    <div className={`border-l-2 ${typeColor} rounded-r bg-[rgba(255,255,255,0.02)]`}>
      <div
        className={`flex items-center gap-2 p-1.5 sm:p-2 car:p-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors ${carMode ? 'min-h-[48px]' : ''}`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        {!carMode && (
          expanded
            ? <ChevronDown className="size-2.5 text-dashbot-muted shrink-0" />
            : <ChevronRight className="size-2.5 text-dashbot-muted shrink-0" />
        )}

        <span className="text-[10px] sm:text-[11px] car:text-sm font-medium text-dashbot-text truncate flex-1">
          {session.label}
        </span>

        <span className={`inline-flex items-center gap-0.5 text-[9px] car:text-xs font-medium ${config.color} shrink-0`}>
          <Icon className="size-2.5 car:size-3" />
          <span className="hidden sm:inline">{config.label}</span>
        </span>

        {/* Close button */}
        {onClose && session.safety !== 'unsafe' && !confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
            className={`p-0.5 car:p-1.5 rounded text-dashbot-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ${carMode ? 'min-w-[40px] min-h-[40px] flex items-center justify-center' : ''}`}
            aria-label={`Close ${session.label}`}
            title={session.safetyReason}
          >
            <X className="size-3 car:size-3.5" />
          </button>
        )}

        {/* Confirm close */}
        {confirming && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className={`text-[9px] car:text-xs ${session.safety === 'caution' ? 'text-yellow-400' : 'text-dashbot-muted'}`}>
              {session.safety === 'caution' ? '⚠ Sure?' : 'Close?'}
            </span>
            <button
              onClick={() => { onClose!(session.key); setConfirming(false) }}
              className="p-0.5 car:p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X className="size-3 car:size-3.5" />
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="p-0.5 car:p-1 rounded bg-dashbot-border/50 text-dashbot-muted hover:text-dashbot-text transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {expanded && !carMode && (
        <div className="px-3 pb-2 space-y-1 text-[10px] border-t border-dashbot-border/20">
          <p className="text-dashbot-muted pt-1.5">{session.description}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-dashbot-muted">Model</span>
            <span className="text-dashbot-primary font-mono">{session.model}</span>
            <span className="text-dashbot-muted">Context</span>
            <span className={
              session.context_percent > 80 ? 'text-red-400' :
              session.context_percent > 60 ? 'text-yellow-400' :
              'text-green-400'
            }>
              {session.tokens} ({session.context_percent}%)
            </span>
            <span className="text-dashbot-muted">Age</span>
            <span className="text-dashbot-text">{session.age}</span>
          </div>
          {session.safety !== 'unsafe' && (
            <div className="pt-0.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                session.safety === 'safe'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-yellow-500/15 text-yellow-400'
              }`}>
                {session.safety === 'safe' ? 'Safe to close' : 'Will interrupt'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Architecture help ────────────────────────
function ArchitectureHelp() {
  const [show, setShow] = useState(false)

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-1 text-[10px] sm:text-xs text-dashbot-muted hover:text-dashbot-text transition-colors"
      >
        <Info className="size-3" />
        How agents work
      </button>
    )
  }

  return (
    <div className="p-2.5 sm:p-3 rounded-lg bg-dashbot-primary/5 border border-dashbot-primary/20 text-[10px] sm:text-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-medium text-dashbot-text">Agent Architecture</span>
        <button onClick={() => setShow(false)} className="text-dashbot-muted hover:text-dashbot-text">
          <X className="size-3" />
        </button>
      </div>
      <p className="text-dashbot-muted">
        <strong className="text-green-400">Main Agent</strong> — The router/orchestrator. Receives all messages and dispatches work.
      </p>
      <p className="text-dashbot-muted">
        <strong className="text-amber-400">Crons</strong> — Scheduled tasks that run independently. Results saved for main agent.
      </p>
      <p className="text-dashbot-muted">
        <strong className="text-blue-400">Channels</strong> — Active chat sessions (DashBot web, Discord, etc).
      </p>
    </div>
  )
}

// ─── Main component ────────────────────────
export default function AgentHierarchyWidget({ data, sessions, onCloseSession }: Props) {
  const { carMode } = useCarMode()
  const parsed = parseSessions(sessions)
  const { main, children } = groupSessionsByParent(parsed)

  const sessionsByType = {
    channel: children.filter(s => s.type === 'dashbot' || s.type === 'channel'),
    cron: children.filter(s => s.type === 'cron'),
    other: children.filter(s => s.type === 'unknown' || s.type === 'subagent'),
  }

  const [showSessions, setShowSessions] = useState(false)

  return (
    <Card className={carMode ? 'car:border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Network className="size-4 sm:size-5 car:size-6 text-dashbot-primary" />
          <span className="car:text-lg">Agent Hierarchy</span>
          <HelpButton topic="Agent Hierarchy" context={`Agent hierarchy showing: main agent (${data.main_model}), ${parsed.length} sessions. How does the agent hierarchy work?`} />
        </CardTitle>
        <CardDescription className="car:text-sm">
          {data.running
            ? `${data.session_count} session${data.session_count !== 1 ? 's' : ''}`
            : 'Agent stopped'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">

          {/* ─── Main Agent Card ─── */}
          <div className={`p-3 sm:p-4 car:p-5 rounded-lg border border-green-500/30 bg-green-500/5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="size-4 sm:size-5 car:size-6 text-green-400" />
                <div>
                  <span className="text-sm sm:text-base car:text-lg font-semibold text-dashbot-text">
                    Main Agent
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] sm:text-xs car:text-sm text-dashbot-primary font-mono">
                      {data.main_model}
                    </span>
                    <span className="text-[10px] sm:text-xs car:text-sm text-dashbot-muted">
                      router / orchestrator
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 car:w-3.5 car:h-3.5 rounded-full ${
                    data.running
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  }`}
                />
                <span className="text-xs car:text-sm text-dashbot-muted">
                  {data.main_session_age}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Sessions ─── */}
          <div className="border-t border-dashbot-border/50 pt-3">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className={`w-full flex items-center gap-1.5 text-dashbot-muted text-[10px] sm:text-xs car:text-sm font-medium uppercase tracking-wider hover:text-dashbot-text transition-colors ${carMode ? 'min-h-[44px]' : ''}`}
            >
              {showSessions
                ? <ChevronDown className="size-3 car:size-3.5" />
                : <ChevronRight className="size-3 car:size-3.5" />}
              Sessions ({parsed.length})
            </button>

            {showSessions && (
              <div className="mt-2 space-y-3">
                {/* Main session */}
                {main && (
                  <div>
                    <SessionRow session={main} onClose={onCloseSession} />
                  </div>
                )}

                {/* Channel sessions */}
                {sessionsByType.channel.length > 0 && (
                  <div>
                    <div className="text-[9px] sm:text-[10px] car:text-xs text-dashbot-muted font-medium mb-1 ml-1">
                      Channels
                    </div>
                    <div className="space-y-1 ml-2 sm:ml-3">
                      {sessionsByType.channel.map(s => (
                        <SessionRow key={s.key} session={s} onClose={onCloseSession} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Cron sessions */}
                {sessionsByType.cron.length > 0 && (
                  <div>
                    <div className="text-[9px] sm:text-[10px] car:text-xs text-dashbot-muted font-medium mb-1 ml-1">
                      Cron Sessions
                    </div>
                    <div className={`space-y-1 ml-2 sm:ml-3 ${!carMode ? 'max-h-32 overflow-y-auto' : ''}`}>
                      {sessionsByType.cron.map(s => (
                        <SessionRow key={s.key} session={s} onClose={onCloseSession} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other sessions */}
                {sessionsByType.other.length > 0 && (
                  <div>
                    <div className="text-[9px] sm:text-[10px] car:text-xs text-dashbot-muted font-medium mb-1 ml-1">
                      Other
                    </div>
                    <div className="space-y-1 ml-2 sm:ml-3">
                      {sessionsByType.other.map(s => (
                        <SessionRow key={s.key} session={s} onClose={onCloseSession} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Architecture help */}
          {!carMode && (
            <div className="pt-1 border-t border-dashbot-border/30">
              <ArchitectureHelp />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
