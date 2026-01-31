import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { Flame } from 'lucide-react'
import type { TokenBurnData } from '@/types/status'

interface Props {
  data: TokenBurnData
}

export default function TokenBurnWidget({ data }: Props) {
  const contextColor = data.main_context_percent > 80
    ? 'text-red-400'
    : data.main_context_percent > 60
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Flame className="size-4 sm:size-5 text-orange-400" />
          Live Token Burn
          <HelpButton topic="Token Burn" description="How many tokens used, context window usage, cost" />
        </CardTitle>
        <CardDescription>Token usage and context window</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Main Session</span>
            <span className="text-dashbot-text text-xs sm:text-sm font-medium font-mono">
              {data.main_tokens}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-dashbot-muted text-xs sm:text-sm">Context Window</span>
              <span className={`text-xs sm:text-sm font-medium ${contextColor}`}>
                {data.main_context_percent}%
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.main_context_percent > 80
                    ? 'bg-red-500'
                    : data.main_context_percent > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(data.main_context_percent, 100)}%` }}
                role="progressbar"
                aria-valuenow={data.main_context_percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Total Sessions</span>
            <span className="text-dashbot-text text-xs sm:text-sm font-medium">
              {data.total_sessions}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dashbot-muted text-xs sm:text-sm">Model</span>
            <span className="text-dashbot-primary text-xs sm:text-sm font-medium">
              {data.model}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
