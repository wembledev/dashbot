import { Clock, AlertCircle } from 'lucide-react'
import type { SidebarCron, DetailSelection } from '@/types/sidebar'

interface CronListProps {
  crons: SidebarCron[]
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function CronList({ crons, selection, onSelect }: CronListProps) {
  if (crons.length === 0) return null

  const errorCount = crons.filter(c => c.status === 'failed').length
  const isSelected = selection?.type === 'cron-list'

  return (
    <div className="px-2 py-1 border-t border-dashbot-border">
      <button
        onClick={() => onSelect({ type: 'cron-list', id: 'crons' })}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSelected
            ? 'bg-blue-500/10 text-blue-400'
            : 'text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface'
        }`}
      >
        <Clock className="size-4 text-indigo-400 shrink-0" />
        <span className="uppercase tracking-wider text-xs font-medium flex-1 text-left">Crons</span>
        <span className="text-xs text-dashbot-muted font-normal normal-case tracking-normal">
          {crons.length} job{crons.length !== 1 ? 's' : ''}
          {errorCount > 0 && (
            <span className="text-red-400 ml-1.5 inline-flex items-center gap-0.5">
              <AlertCircle className="size-3 inline" />
              {errorCount}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
