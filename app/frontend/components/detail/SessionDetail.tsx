import { useState } from 'react'
import { Zap, Pause, XCircle, CheckCircle, Globe, X } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import type { SidebarSession } from '@/types/sidebar'

const STATUS_CONFIG: Record<SidebarSession['status'], { label: string; color: string; dotColor: string; icon: typeof Zap }> = {
  active:    { label: 'Active',    color: 'text-green-400',  dotColor: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]', icon: Zap },
  idle:      { label: 'Idle',      color: 'text-yellow-400', dotColor: 'bg-yellow-500', icon: Pause },
  completed: { label: 'Completed', color: 'text-blue-400',   dotColor: 'bg-blue-500',   icon: CheckCircle },
  failed:    { label: 'Failed',    color: 'text-red-400',    dotColor: 'bg-red-500',     icon: XCircle },
}

const TYPE_LABELS: Record<string, string> = {
  main: 'Main Router',
  cron: 'Cron Job',
  subagent: 'Sub-Agent',
  dashbot: 'DashBot Chat',
  channel: 'Channel',
  unknown: 'Unknown',
}

interface SessionDetailProps {
  session: SidebarSession
  onBack?: () => void
}

export default function SessionDetail({ session, onBack }: SessionDetailProps) {
  const [closing, setClosing] = useState(false)
  const [closed, setClosed] = useState(false)
  const config = STATUS_CONFIG[session.status]

  const closeSession = async () => {
    if (!confirm(`Close session "${session.label}"? This cannot be undone.`)) return
    setClosing(true)
    try {
      const res = await fetch(`/status/sessions/${encodeURIComponent(session.key)}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin',
      })
      if (res.ok) setClosed(true)
    } catch {
      // silently fail
    } finally {
      setClosing(false)
    }
  }

  if (closed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="size-8 text-green-400 mb-3" />
        <p className="text-sm text-dashbot-text">Session closed successfully</p>
        <p className="text-xs text-dashbot-muted mt-1">Select another item from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← All Sessions
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            session.status === 'active' ? 'bg-green-500/10' :
            session.status === 'idle' ? 'bg-yellow-500/10' :
            session.status === 'failed' ? 'bg-red-500/10' : 'bg-dashbot-surface'
          }`}>
            <Globe className={`size-5 ${config.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-dashbot-text">{session.label}</h2>
            <p className="text-xs text-dashbot-muted font-mono">{session.key}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Kind" value={TYPE_LABELS[session.type] || session.type} />
        <InfoCard label="Status" value={config.label} />
        <InfoCard label="Model" value={session.model || 'default'} mono />
        <InfoCard label="Context" value={`${session.contextPercent}%`} />
        {session.channel && <InfoCard label="Channel" value={session.channel} />}
        {session.age && <InfoCard label="Age" value={session.age} />}
        {session.tokens && <InfoCard label="Tokens" value={session.tokens} />}
      </div>

      {/* Context usage bar */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-dashbot-text">Context Window</h3>
          <HelpButton
            topic="Session Context"
            context={`Session "${session.label}" (${session.key}), type=${TYPE_LABELS[session.type] || session.type}, model=${session.model}, context window at ${session.contextPercent}%, tokens=${session.tokens || 'unknown'}, status=${config.label}.`}
          />
        </div>
        <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-4">
          <div className="flex items-center justify-between text-xs text-dashbot-muted mb-1.5">
            <span>Context Used</span>
            <span>{session.contextPercent}%</span>
          </div>
          <div className="w-full h-2 bg-dashbot-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                session.contextPercent > 80 ? 'bg-red-500' :
                session.contextPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(session.contextPercent, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      {session.type !== 'main' && (
        <section>
          <button
            onClick={closeSession}
            disabled={closing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <X className="size-3" />
            {closing ? 'Closing...' : 'Close Session'}
          </button>
        </section>
      )}
    </div>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-3">
      <p className="text-xs text-dashbot-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-dashbot-text truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
