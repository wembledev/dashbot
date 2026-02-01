import { useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { useCarMode } from '@/contexts/car-mode-context'
import {
  ListTodo, Clock, CheckCircle, AlertCircle, Pause, Play,
  Power, PowerOff, ChevronDown, ChevronRight, RotateCw
} from 'lucide-react'
import type { TasksData, CronJob } from '@/types/status'

interface Props {
  data: TasksData
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

function statusIcon(status: string, hasError: boolean) {
  if (hasError) return <AlertCircle className="size-3 sm:size-3.5 text-red-400" />
  switch (status) {
    case 'ok': return <CheckCircle className="size-3 sm:size-3.5 text-green-400" />
    case 'skipped': return <Pause className="size-3 sm:size-3.5 text-yellow-400" />
    case 'idle': return <Clock className="size-3 sm:size-3.5 text-dashbot-muted" />
    default: return <AlertCircle className="size-3 sm:size-3.5 text-red-400" />
  }
}

function healthBadge(health: string) {
  const colors: Record<string, string> = {
    healthy: 'text-green-400',
    degraded: 'text-yellow-400',
    failing: 'text-red-400',
  }
  return <span className={`${colors[health] || 'text-gray-400'} text-[10px] sm:text-xs`}>●</span>
}

function CronJobRow({ job }: { job: CronJob }) {
  const [expanded, setExpanded] = useState(false)
  const [running, setRunning] = useState(false)
  const [toggling, setToggling] = useState(false)
  const { carMode } = useCarMode()

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setRunning(true)
    fetch(`/cron/${encodeURIComponent(job.id)}/run`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    })
      .then(r => r.json())
      .catch(() => {})
      .finally(() => setTimeout(() => setRunning(false), 3000))
  }, [job.id])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setToggling(true)
    const newEnabled = job.enabled === false
    fetch(`/cron/${encodeURIComponent(job.id)}/toggle?enabled=${newEnabled}`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
      credentials: 'same-origin',
    })
      .then(r => r.json())
      .catch(() => {})
      .finally(() => setTimeout(() => setToggling(false), 2000))
  }, [job.id, job.enabled])

  const isDisabled = job.enabled === false

  return (
    <div
      className={`rounded-lg transition-colors ${
        job.error
          ? 'bg-red-500/10 hover:bg-red-500/15'
          : isDisabled
          ? 'bg-[rgba(255,255,255,0.01)] opacity-50'
          : 'bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)]'
      }`}
    >
      {/* Main row */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 car:p-3 cursor-pointer ${carMode ? 'min-h-[52px]' : ''}`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        {!carMode && (
          expanded
            ? <ChevronDown className="size-3 text-dashbot-muted shrink-0" />
            : <ChevronRight className="size-3 text-dashbot-muted shrink-0" />
        )}

        <div className="mt-0.5 shrink-0">{statusIcon(job.status, !!job.error)}</div>

        <div className="flex-1 min-w-0">
          <div className={`text-xs sm:text-sm car:text-base font-medium truncate ${
            isDisabled ? 'text-dashbot-muted line-through' : 'text-dashbot-text'
          }`}>
            {job.name}
          </div>
          {!carMode && (
            <div className="text-dashbot-muted text-[10px] sm:text-xs flex gap-2 sm:gap-3 mt-0.5">
              {job.next_run && !isDisabled && (
                <span className="flex items-center gap-0.5">
                  <Clock className="size-2.5" />
                  {job.next_run}
                </span>
              )}
              <span className={`capitalize ${
                job.target === 'isolated' ? 'text-violet-400' : 'text-cyan-400'
              }`}>
                {job.target}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {/* Run now */}
          {!isDisabled && (
            <button
              onClick={handleRun}
              disabled={running}
              className={`p-1 car:p-1.5 rounded transition-colors ${
                running
                  ? 'text-green-400 bg-green-500/20'
                  : 'text-dashbot-muted hover:text-green-400 hover:bg-green-500/10'
              }`}
              title="Run now"
              aria-label={`Run ${job.name} now`}
            >
              {running
                ? <RotateCw className="size-3 car:size-3.5 animate-spin" />
                : <Play className="size-3 car:size-3.5" />
              }
            </button>
          )}

          {/* Enable/disable */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`p-1 car:p-1.5 rounded transition-colors ${
              isDisabled
                ? 'text-dashbot-muted hover:text-green-400 hover:bg-green-500/10'
                : 'text-dashbot-muted hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={isDisabled ? 'Enable' : 'Disable'}
            aria-label={`${isDisabled ? 'Enable' : 'Disable'} ${job.name}`}
          >
            {isDisabled
              ? <Power className="size-3 car:size-3.5" />
              : <PowerOff className="size-3 car:size-3.5" />
            }
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 space-y-1.5 text-[10px] sm:text-xs border-t border-dashbot-border/30">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5">
            <span className="text-dashbot-muted">Schedule</span>
            <span className="text-dashbot-text font-mono">{job.schedule}</span>

            <span className="text-dashbot-muted">Target</span>
            <span className={`font-medium ${
              job.target === 'isolated' ? 'text-violet-400' : 'text-cyan-400'
            }`}>
              {job.target}
            </span>

            <span className="text-dashbot-muted">Last run</span>
            <span className="text-dashbot-text">{job.last_run || 'never'}</span>

            <span className="text-dashbot-muted">Next run</span>
            <span className="text-dashbot-text">{job.next_run || '-'}</span>

            <span className="text-dashbot-muted">Status</span>
            <span className={`capitalize ${
              job.status === 'ok' ? 'text-green-400' :
              job.error ? 'text-red-400' : 'text-dashbot-text'
            }`}>
              {job.status}
            </span>

            <span className="text-dashbot-muted">ID</span>
            <span className="text-dashbot-muted font-mono truncate">{job.id}</span>
          </div>

          {job.error && (
            <div className="pt-1">
              <span className="text-dashbot-muted">Error: </span>
              <span className="text-red-400">{job.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TasksWidget({ data }: Props) {
  const { carMode } = useCarMode()

  return (
    <Card className={carMode ? 'car:border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <ListTodo className="size-4 sm:size-5 car:size-6 text-purple-400" />
          <span className="car:text-lg">Cron Jobs</span>
          <HelpButton topic="Cron Jobs" context={`${data.cron_jobs.length} cron jobs configured, ${data.cron_errors?.length ?? 0} errors. Next job: ${data.next_job || 'none'}. Health: ${data.cron_health || 'unknown'}. What are cron jobs and how do they work?`} />
          {healthBadge(data.cron_health ?? 'healthy')}
        </CardTitle>
        <CardDescription className="car:text-sm">
          {data.cron_jobs.length} jobs
          {(data.cron_errors?.length ?? 0) > 0 && (
            <span className="text-red-400 ml-2">
              · {data.cron_errors?.length ?? 0} error{(data.cron_errors?.length ?? 0) !== 1 ? 's' : ''}
            </span>
          )}
          {data.next_job && (
            <span className="text-dashbot-muted ml-2">
              · next: {data.next_job}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 sm:space-y-1.5 max-h-64 sm:max-h-80 overflow-y-auto">
          {data.cron_jobs.length === 0 ? (
            <div className="text-dashbot-muted text-xs sm:text-sm text-center py-3 sm:py-4">
              No cron jobs configured
            </div>
          ) : (
            data.cron_jobs.map((job) => (
              <CronJobRow key={job.id} job={job} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
