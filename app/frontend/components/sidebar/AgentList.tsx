import { Bot, Clock } from 'lucide-react'
import type { AgentStatus, DetailSelection } from '@/types/sidebar'

const STATUS_DOT: Record<AgentStatus, string> = {
  running:   'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]',
  idle:      'bg-yellow-500',
  completed: 'bg-blue-500',
  failed:    'bg-red-500',
  timeout:   'bg-orange-500',
}

interface AgentListProps {
  mainAgent: {
    model: string
    status: AgentStatus
    sessionAge: string
    running: boolean
    contextPercent?: number
  }
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function AgentList({ mainAgent, selection, onSelect }: AgentListProps) {
  if (!mainAgent.running) return null

  return (
    <div className="px-2 py-2 space-y-1">
      <div className="px-2 py-1">
        <span className="text-xs font-medium text-dashbot-muted uppercase tracking-wider">
          Agent
        </span>
      </div>

      <button
        onClick={() => onSelect({ type: 'agent-main', id: 'main' })}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
          selection?.type === 'agent-main'
            ? 'bg-blue-500/10 border border-blue-500/20'
            : 'bg-dashbot-surface border border-dashbot-border hover:bg-dashbot-surface'
        }`}
      >
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-green-400 shrink-0" />
          <span className="text-sm font-semibold text-dashbot-text flex-1">Main Agent</span>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[mainAgent.status]}`} />
        </div>
        <div className="flex items-center gap-2 ml-6 mt-0.5">
          <span className="text-xs text-blue-400 font-mono">{mainAgent.model}</span>
          <span className="text-xs text-zinc-700">·</span>
          <span className="text-xs text-dashbot-muted flex items-center gap-1">
            <Clock className="size-2.5" />
            {mainAgent.sessionAge}
          </span>
        </div>
        {mainAgent.contextPercent !== undefined && mainAgent.contextPercent > 0 && (
          <div className="ml-6 mt-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-dashbot-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    mainAgent.contextPercent > 80 ? 'bg-red-500' :
                    mainAgent.contextPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(mainAgent.contextPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-600 font-mono w-7 text-right">{mainAgent.contextPercent}%</span>
            </div>
          </div>
        )}
      </button>
    </div>
  )
}
