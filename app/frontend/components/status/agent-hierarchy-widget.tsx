import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { useCarMode } from '@/contexts/car-mode-context'
import {
  ChevronDown, ChevronRight, X,
  Zap, CheckCircle, XCircle, Pause,
  Network
} from 'lucide-react'
import { parseSessions } from '@/lib/sessions'
import type { SessionInfo, ParsedSession, SessionStatus } from '@/types/status'

interface Props {
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

export default function AgentHierarchyWidget({ sessions, onCloseSession }: Props) {
  const { carMode } = useCarMode()
  const parsed = parseSessions(sessions)

  return (
    <Card className={carMode ? 'car:border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Network className="size-4 sm:size-5 car:size-6 text-dashbot-primary" />
          <span className="car:text-lg">Sessions</span>
          <HelpButton topic="Sessions" context={`${parsed.length} session${parsed.length !== 1 ? 's' : ''}. Sessions are active conversations with different models.`} />
        </CardTitle>
        <CardDescription className="car:text-sm">
          {parsed.length} session{parsed.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parsed.length > 0 ? (
          <div className="space-y-1.5">
            {parsed.map(s => (
              <SessionRow key={s.key} session={s} onClose={onCloseSession} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-dashbot-muted text-xs">
            No active sessions
          </div>
        )}
      </CardContent>
    </Card>
  )
}
