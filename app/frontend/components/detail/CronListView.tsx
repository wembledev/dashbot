import { useState } from 'react'
import { Clock, Play, CheckCircle, XCircle, RotateCw, Power, PowerOff } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import type { SidebarCron, DetailSelection } from '@/types/sidebar'

interface CronListViewProps {
  crons: SidebarCron[]
  onSelectCron: (selection: DetailSelection) => void
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

function CronRow({ cron, onSelect }: { cron: SidebarCron; onSelect: () => void }) {
  const [running, setRunning] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRunning(true)
    fetch(`/cron/${encodeURIComponent(cron.id)}/run`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    })
      .catch(() => {})
      .finally(() => setTimeout(() => setRunning(false), 3000))
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setToggling(true)
    const newEnabled = cron.enabled === false
    fetch(`/cron/${encodeURIComponent(cron.id)}/toggle?enabled=${newEnabled}`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    })
      .catch(() => {})
      .finally(() => setTimeout(() => setToggling(false), 2000))
  }

  const isDisabled = cron.enabled === false
  const statusIcon = cron.status === 'ok' ? CheckCircle :
                     cron.status === 'failed' ? XCircle : Clock
  const StatusIcon = statusIcon
  const statusColor = cron.status === 'ok' ? 'text-green-400' :
                      cron.status === 'failed' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
        isDisabled
          ? 'bg-zinc-900/30 border-zinc-800/30 opacity-60'
          : cron.status === 'failed'
            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
            : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800/50'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <StatusIcon className={`size-4 shrink-0 ${statusColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${isDisabled ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
            {cron.name}
          </span>
          <span className="text-xs text-zinc-600 font-mono shrink-0">{cron.schedule}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {cron.nextRun && !isDisabled && (
            <span className="text-xs text-zinc-500">Next: {cron.nextRun}</span>
          )}
          {cron.lastRun && (
            <span className="text-xs text-zinc-600">Last: {cron.lastRun}</span>
          )}
          {cron.target && (
            <span className={`text-xs font-medium ${
              cron.target === 'isolated' ? 'text-violet-400' : 'text-cyan-400'
            }`}>
              {cron.target}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        {!isDisabled && (
          <button
            onClick={handleRun}
            disabled={running}
            className={`p-1.5 rounded-lg transition-colors ${
              running ? 'text-green-400 bg-green-500/20' : 'text-zinc-500 hover:text-green-400 hover:bg-green-500/10'
            }`}
            title="Run now"
            aria-label={`Run ${cron.name}`}
          >
            {running ? <RotateCw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          </button>
        )}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`p-1.5 rounded-lg transition-colors ${
            isDisabled
              ? 'text-zinc-500 hover:text-green-400 hover:bg-green-500/10'
              : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
          }`}
          title={isDisabled ? 'Enable' : 'Disable'}
          aria-label={`${isDisabled ? 'Enable' : 'Disable'} ${cron.name}`}
        >
          {isDisabled ? <Power className="size-3.5" /> : <PowerOff className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function CronListView({ crons, onSelectCron }: CronListViewProps) {
  const errorCount = crons.filter(c => c.status === 'failed').length
  const enabledCount = crons.filter(c => c.enabled !== false).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Clock className="size-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-zinc-100">Cron Jobs</h2>
            <p className="text-sm text-zinc-500">
              {crons.length} total · {enabledCount} enabled
              {errorCount > 0 && <span className="text-red-400"> · {errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>
        <HelpButton
          topic="Cron Jobs"
          context={`${crons.length} cron jobs configured, ${enabledCount} enabled, ${errorCount} with errors. Cron jobs are scheduled tasks that run automatically.`}
        />
      </div>

      {/* Cron list */}
      <div className="space-y-2">
        {crons.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Clock className="size-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No cron jobs configured</p>
          </div>
        ) : (
          crons.map(cron => (
            <CronRow
              key={cron.id}
              cron={cron}
              onSelect={() => onSelectCron({ type: 'cron', id: cron.id })}
            />
          ))
        )}
      </div>
    </div>
  )
}
