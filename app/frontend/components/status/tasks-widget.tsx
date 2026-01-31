import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { ListTodo, Clock, CheckCircle, AlertCircle, Pause } from 'lucide-react'
import type { TasksData } from '@/types/status'

interface Props {
  data: TasksData
}

const statusIcon = (status: string, hasError: boolean) => {
  if (hasError) {
    return <AlertCircle className="size-3 sm:size-3.5 text-red-400" />
  }
  
  switch (status) {
    case 'ok':
      return <CheckCircle className="size-3 sm:size-3.5 text-green-400" />
    case 'skipped':
      return <Pause className="size-3 sm:size-3.5 text-yellow-400" />
    case 'idle':
      return <Clock className="size-3 sm:size-3.5 text-dashbot-muted" />
    default:
      return <AlertCircle className="size-3 sm:size-3.5 text-red-400" />
  }
}

const healthBadge = (health: string) => {
  switch (health) {
    case 'healthy':
      return <span className="text-green-400 text-[10px] sm:text-xs">●</span>
    case 'degraded':
      return <span className="text-yellow-400 text-[10px] sm:text-xs">●</span>
    case 'failing':
      return <span className="text-red-400 text-[10px] sm:text-xs">●</span>
    default:
      return null
  }
}

export default function TasksWidget({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <ListTodo className="size-4 sm:size-5 text-purple-400" />
          Scheduled Tasks
          <HelpButton topic="Scheduled Tasks" description="Cron jobs, their schedules, next run times, and health" />
          {healthBadge(data.cron_health ?? 'healthy')}
        </CardTitle>
        <CardDescription>
          {data.cron_jobs.length} cron jobs configured
          {(data.cron_errors?.length ?? 0) > 0 && (
            <span className="text-red-400 ml-2">
              ({data.cron_errors?.length ?? 0} {(data.cron_errors?.length ?? 0) === 1 ? 'error' : 'errors'})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 sm:space-y-2.5 max-h-48 sm:max-h-64 overflow-y-auto">
          {data.cron_jobs.length === 0 ? (
            <div className="text-dashbot-muted text-xs sm:text-sm text-center py-3 sm:py-4">
              No cron jobs configured
            </div>
          ) : (
            data.cron_jobs.map((job) => (
              <div
                key={job.id}
                className={`flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                  job.error
                    ? 'bg-red-500/10 hover:bg-red-500/20'
                    : 'bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)]'
                }`}
              >
                <div className="mt-0.5">{statusIcon(job.status, !!job.error)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-dashbot-text text-xs sm:text-sm font-medium truncate">
                    {job.name}
                  </div>
                  <div className="text-dashbot-muted text-[10px] sm:text-xs flex gap-2 sm:gap-3 mt-0.5">
                    {job.next_run && (
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Clock className="size-2.5 sm:size-3" />
                        {job.next_run}
                      </span>
                    )}
                    <span className="capitalize">{job.status}</span>
                  </div>
                  {job.error && (
                    <div className="text-red-400 text-[10px] sm:text-xs mt-1 truncate">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {data.next_job && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-dashbot-border">
            <div className="text-dashbot-muted text-[10px] sm:text-xs">
              Next: <span className="text-dashbot-text">{data.next_job}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
