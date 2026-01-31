import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { Bot, Users } from 'lucide-react'
import type { AgentStatusData } from '@/types/status'

interface Props {
  data: AgentStatusData
}

export default function AgentStatusWidget({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Bot className="size-4 sm:size-5 text-dashbot-primary" />
          Agent Status
          <HelpButton topic="Agent Status" description="Is the AI agent running, how many sessions, what model" />
        </CardTitle>
        <CardDescription>Main agent and sub-agents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Main Agent</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                  data.running
                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`}
                aria-label={data.running ? 'running' : 'stopped'}
              />
              <span className="text-dashbot-text text-xs sm:text-sm font-medium">
                {data.running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Active Sessions</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="size-3.5 sm:size-4 text-dashbot-muted" />
              <span className="text-dashbot-text text-xs sm:text-sm font-medium">
                {data.session_count}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Last Active</span>
            <span className="text-dashbot-text text-xs sm:text-sm font-medium">
              {data.main_session_age}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Model</span>
            <span className="text-dashbot-primary text-xs sm:text-sm font-medium">
              {data.main_model}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
