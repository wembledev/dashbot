import { Layers } from 'lucide-react'
import type { SidebarSession, DetailSelection } from '@/types/sidebar'

interface SessionListProps {
  sessions: SidebarSession[]
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function SessionList({ sessions, selection, onSelect }: SessionListProps) {
  if (sessions.length === 0) return null

  const activeCount = sessions.filter(s => s.status === 'active').length
  const isSelected = selection?.type === 'session-list'

  return (
    <div className="px-2 py-1 border-t border-dashbot-border">
      <button
        onClick={() => onSelect({ type: 'session-list', id: 'sessions' })}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSelected
            ? 'bg-blue-500/10 text-blue-400'
            : 'text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface'
        }`}
      >
        <Layers className="size-4 text-cyan-400 shrink-0" />
        <span className="uppercase tracking-wider text-xs font-medium flex-1 text-left">Sessions</span>
        <span className="text-xs text-dashbot-muted font-normal normal-case tracking-normal">
          {sessions.length} total
          {activeCount > 0 && (
            <span className="text-green-400 ml-1.5">
              · {activeCount} active
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
