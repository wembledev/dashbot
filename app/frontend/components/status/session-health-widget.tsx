import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { HeartPulse, Cpu, Clock } from 'lucide-react'
import type { SessionHealthData, SessionInfo } from '@/types/status'

interface Props {
  data: SessionHealthData
  sessions: SessionInfo[]
}

export default function SessionHealthWidget({ data, sessions }: Props) {
  const contextColor = data.context_percent > 80
    ? 'text-red-400'
    : data.context_percent > 60
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <HeartPulse className="size-4 sm:size-5 text-red-400" />
          Session Health
          <HelpButton topic="Session Health" description="Main session uptime, context usage, all active sessions" />
        </CardTitle>
        <CardDescription>Active sessions overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 sm:space-y-4">
          {/* Main session stats */}
          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
              <Clock className="size-3 sm:size-3.5" />
              Uptime
            </span>
            <span className="text-dashbot-text text-xs sm:text-sm font-medium">
              {data.uptime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
              <Cpu className="size-3 sm:size-3.5" />
              Model
            </span>
            <span className="text-dashbot-primary text-xs sm:text-sm font-medium">
              {data.model}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Context Usage</span>
            <span className={`text-xs sm:text-sm font-medium ${contextColor}`}>
              {data.tokens} ({data.context_percent}%)
            </span>
          </div>

          {/* Session list */}
          {sessions.length > 0 && (
            <div className="mt-1.5 sm:mt-2 pt-2 sm:pt-3 border-t border-dashbot-border">
              <div className="text-dashbot-muted text-[10px] sm:text-xs font-medium mb-1.5 sm:mb-2 uppercase tracking-wider">
                All Sessions ({sessions.length})
              </div>
              <div className="space-y-1 sm:space-y-1.5 max-h-36 sm:max-h-48 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.key}
                    className="flex items-center justify-between p-1 sm:p-1.5 rounded bg-[rgba(255,255,255,0.03)] text-[10px] sm:text-xs"
                  >
                    <span className="text-dashbot-text truncate flex-1 mr-1.5 sm:mr-2 font-mono">
                      {session.key.length > 30
                        ? `...${session.key.slice(-25)}`
                        : session.key}
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-dashbot-muted shrink-0">
                      <span className="hidden sm:inline">{session.model}</span>
                      <span className={
                        session.context_percent > 80 ? 'text-red-400' :
                        session.context_percent > 60 ? 'text-yellow-400' :
                        'text-green-400'
                      }>
                        {session.context_percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
