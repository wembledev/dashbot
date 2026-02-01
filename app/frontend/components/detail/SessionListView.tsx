import { useState } from 'react'
import { Layers, X } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import type { SidebarSession, DetailSelection } from '@/types/sidebar'

const STATUS_CONFIG: Record<SidebarSession['status'], { label: string; color: string; dotColor: string }> = {
  active:    { label: 'Active',    color: 'text-green-400',  dotColor: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' },
  idle:      { label: 'Idle',      color: 'text-yellow-400', dotColor: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'text-blue-400',   dotColor: 'bg-blue-500' },
  failed:    { label: 'Failed',    color: 'text-red-400',    dotColor: 'bg-red-500' },
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  main:     { label: 'Main',      color: 'bg-green-500/15 text-green-400' },
  cron:     { label: 'Cron',      color: 'bg-amber-500/15 text-amber-400' },
  subagent: { label: 'Sub-Agent', color: 'bg-violet-500/15 text-violet-400' },
  dashbot:  { label: 'DashBot',   color: 'bg-blue-500/15 text-blue-400' },
  channel:  { label: 'Channel',   color: 'bg-cyan-500/15 text-cyan-400' },
  unknown:  { label: 'Unknown',   color: 'bg-zinc-500/15 text-zinc-400' },
}

interface SessionListViewProps {
  sessions: SidebarSession[]
  onSelectSession: (selection: DetailSelection) => void
}

function SessionRow({ session, onSelect }: { session: SidebarSession; onSelect: () => void }) {
  const [closing, setClosing] = useState(false)
  const config = STATUS_CONFIG[session.status]
  const badge = TYPE_BADGES[session.type] || TYPE_BADGES.unknown

  const closeSession = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Close session "${session.label}"?`)) return
    setClosing(true)
    fetch(`/status/sessions/${encodeURIComponent(session.key)}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      credentials: 'same-origin',
    })
      .catch(() => {})
      .finally(() => setClosing(false))
  }

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200 truncate">{session.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-zinc-500 font-mono">{session.model}</span>
          {session.age && <span className="text-xs text-zinc-600">{session.age}</span>}
          {session.tokens && <span className="text-xs text-zinc-600">{session.tokens}</span>}
        </div>
      </div>
      {/* Context bar */}
      <div className="w-16 shrink-0">
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                session.contextPercent > 80 ? 'bg-red-500' :
                session.contextPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(session.contextPercent, 100)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 font-mono w-8 text-right">{session.contextPercent}%</span>
        </div>
      </div>
      {/* Close button for non-main sessions */}
      {session.type !== 'main' && (
        <button
          onClick={closeSession}
          disabled={closing}
          className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          aria-label={`Close ${session.label}`}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export default function SessionListView({ sessions, onSelectSession }: SessionListViewProps) {
  const activeCount = sessions.filter(s => s.status === 'active').length
  const idleCount = sessions.filter(s => s.status === 'idle').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Layers className="size-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Sessions</h2>
            <p className="text-sm text-zinc-500">
              {sessions.length} total · {activeCount} active
              {idleCount > 0 && ` · ${idleCount} idle`}
            </p>
          </div>
        </div>
        <HelpButton
          topic="Sessions"
          context={`${sessions.length} sessions, ${activeCount} active, ${idleCount} idle. Sessions are active conversations and task contexts that consume tokens and context window.`}
        />
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Layers className="size-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No active sessions</p>
          </div>
        ) : (
          sessions.map(session => (
            <SessionRow
              key={session.key}
              session={session}
              onSelect={() => onSelectSession({ type: 'session', id: session.key })}
            />
          ))
        )}
      </div>
    </div>
  )
}
