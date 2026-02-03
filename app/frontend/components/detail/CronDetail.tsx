import { useState } from 'react'
import { Clock, Play, CheckCircle, XCircle, Pause } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import type { SidebarCron } from '@/types/sidebar'

interface CronDetailProps {
  cron: SidebarCron
  onBack?: () => void
}

export default function CronDetail({ cron, onBack }: CronDetailProps) {
  const [running, setRunning] = useState(false)
  const [toggling, setToggling] = useState(false)

  const runCron = async () => {
    setRunning(true)
    try {
      await fetch(`/cron/${encodeURIComponent(cron.id)}/run`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin',
      })
    } catch {
      // silently fail
    } finally {
      setRunning(false)
    }
  }

  const toggleCron = async () => {
    setToggling(true)
    try {
      await fetch(`/cron/${encodeURIComponent(cron.id)}/toggle`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin',
      })
    } catch {
      // silently fail
    } finally {
      setToggling(false)
    }
  }

  const statusIcon = cron.status === 'ok' ? CheckCircle :
                     cron.status === 'failed' ? XCircle : Clock
  const StatusIcon = statusIcon
  const statusColor = cron.status === 'ok' ? 'text-green-400' :
                      cron.status === 'failed' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className="space-y-6">
      {/* Back link */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← All Cron Jobs
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Clock className="size-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-dashbot-text">{cron.name}</h2>
            <p className="text-sm text-dashbot-muted font-mono">{cron.schedule}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCron}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <Play className="size-3" />
            {running ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Schedule" value={cron.schedule} mono />
        <InfoCard label="Status" value={cron.status === 'ok' ? 'Healthy' : cron.status} />
        <InfoCard label="Last Run" value={cron.lastRun || 'Never'} />
        <InfoCard label="Next Run" value={cron.nextRun || 'N/A'} />
        {cron.target && <InfoCard label="Target" value={cron.target} />}
        <InfoCard
          label="Enabled"
          value={cron.enabled === false ? 'No' : 'Yes'}
        />
      </div>

      {/* Last run status */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-dashbot-text">Run Status</h3>
          <HelpButton
            topic="Cron Job"
            context={`Cron job "${cron.name}" with schedule ${cron.schedule}. Last run: ${cron.lastRun || 'never'}. Status: ${cron.status}. Target: ${cron.target || 'default'}. Enabled: ${cron.enabled !== false ? 'yes' : 'no'}.`}
          />
        </div>
        <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-4">
          <div className="flex items-center gap-2">
            <StatusIcon className={`size-4 ${statusColor}`} />
            <span className="text-sm text-dashbot-text">
              {cron.status === 'ok' ? 'Last run completed successfully' :
               cron.status === 'failed' ? 'Last run failed' :
               'Status unknown'}
            </span>
          </div>
          {cron.lastRun && (
            <p className="text-xs text-dashbot-muted mt-2 ml-6">{cron.lastRun}</p>
          )}
        </div>
      </section>

      {/* Payload preview */}
      {cron.payloadText && (
        <section>
          <h3 className="text-sm font-medium text-dashbot-text mb-3">Payload</h3>
          <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-4">
            <p className="text-xs text-dashbot-muted mb-1 font-mono">{cron.payloadKind || 'text'}</p>
            <p className="text-sm text-dashbot-text whitespace-pre-wrap line-clamp-6">{cron.payloadText}</p>
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="flex items-center gap-2">
        <button
          onClick={toggleCron}
          disabled={toggling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            cron.enabled === false
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
          }`}
        >
          {cron.enabled === false ? (
            <>
              <Play className="size-3" />
              Enable
            </>
          ) : (
            <>
              <Pause className="size-3" />
              Disable
            </>
          )}
        </button>
      </section>
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
