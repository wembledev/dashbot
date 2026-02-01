import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { Flame } from 'lucide-react'
import { friendlySessionLabel } from '@/lib/sessions'
import type { TokenBurnData, SessionInfo } from '@/types/status'

interface Props {
  data: TokenBurnData
  sessions?: SessionInfo[]
}

export default function TokenBurnWidget({ data, sessions = [] }: Props) {
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
          <HelpButton topic="Token Usage" context={`Token usage panel showing: Main Session ${data.main_tokens} tokens, context window at ${data.main_context_percent}%. Model: ${data.model}. Total sessions: ${data.total_sessions}. What do these numbers mean? When should I be concerned? What happens when context window fills up?`} />
        </CardTitle>
        <CardDescription>Token usage and context window</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 sm:space-y-4">
          {/* Main context window bar */}
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

          {/* Per-session breakdown */}
          {sessions.length > 0 && (
            <div className="pt-1 sm:pt-2 border-t border-dashbot-border">
              <div className="text-dashbot-muted text-[10px] sm:text-xs font-medium mb-1.5 sm:mb-2 uppercase tracking-wider">
                Sessions ({sessions.length})
              </div>
              <div className="space-y-1 sm:space-y-1.5 max-h-36 sm:max-h-48 overflow-y-auto">
                {sessions.map((session) => {
                  const pctColor = session.context_percent > 80 ? 'text-red-400' :
                    session.context_percent > 60 ? 'text-yellow-400' : 'text-green-400'
                  return (
                    <div
                      key={session.key}
                      className="flex items-center justify-between p-1 sm:p-1.5 rounded bg-[rgba(255,255,255,0.03)] text-[10px] sm:text-xs"
                    >
                      <span className="text-dashbot-text truncate flex-1 mr-1.5 sm:mr-2">
                        {friendlySessionLabel(session.key)}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-dashbot-muted shrink-0">
                        <span className="font-mono">{session.tokens}</span>
                        <span className={pctColor}>
                          {session.context_percent}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
