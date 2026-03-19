import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { Bot, Clock } from 'lucide-react'
import { useCarMode } from '@/contexts/car-mode-context'
import type { AgentStatusData } from '@/types/status'

interface Props {
  data: AgentStatusData
}

/** Quick summary card — model, status, session count */
export default function AgentStatusWidget({ data }: Props) {
  const { carMode } = useCarMode()

  return (
    <Card className={carMode ? 'car:border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Bot className="size-4 sm:size-5 car:size-6 text-dashbot-primary" />
          <span className="car:text-lg">Agent Status</span>
          <HelpButton topic="Agent Status" context={`Agent status: ${data.running ? 'running' : 'stopped'}, model=${data.main_model}, uptime=${data.main_session_age}, ${data.session_count} sessions. What do these mean?`} />
        </CardTitle>
        <CardDescription className="car:text-sm">
          {data.running
            ? `${data.session_count} session${data.session_count !== 1 ? 's' : ''} active`
            : 'Agent stopped'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {/* Running status */}
          <div className={`flex items-center justify-between ${carMode ? 'py-2' : ''}`}>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 car:w-4 car:h-4 rounded-full ${
                  data.running
                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`}
                aria-label={data.running ? 'running' : 'stopped'}
              />
              <span className="text-dashbot-text text-sm sm:text-base car:text-lg font-medium">
                {data.running ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-dashbot-muted text-xs car:text-sm">
              <Clock className="size-3 car:size-4" />
              <span>{data.main_session_age}</span>
            </div>
          </div>

          {/* Model */}
          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm car:text-base">Model</span>
            <span className="text-dashbot-primary text-xs sm:text-sm car:text-base font-medium font-mono">
              {data.main_model}
            </span>
          </div>

          {/* Sessions */}
          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm car:text-base">Sessions</span>
            <span className="text-dashbot-text text-xs sm:text-sm car:text-base font-medium">
              {data.session_count}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
