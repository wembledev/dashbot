import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import HelpButton from './help-button'
import { useCarMode } from '@/contexts/car-mode-context'
import {
  Activity, Zap, CheckCircle, XCircle, Clock, Timer,
  ChevronDown, ChevronRight, GitBranch, Bot, AlertTriangle
} from 'lucide-react'
import { cable } from '@/lib/cable'
import type { AgentEvent } from '@/types/status'
import type { Subscription } from '@rails/actioncable'

interface Props {
  initialEvents: AgentEvent[]
}

const EVENT_CONFIG: Record<string, { icon: typeof Zap; color: string; bgColor: string; label: string }> = {
  spawned:        { icon: Zap,           color: 'text-violet-400',  bgColor: 'bg-violet-500/15', label: 'Spawned' },
  completed:      { icon: CheckCircle,   color: 'text-green-400',   bgColor: 'bg-green-500/15',  label: 'Completed' },
  failed:         { icon: XCircle,       color: 'text-red-400',     bgColor: 'bg-red-500/15',    label: 'Failed' },
  timeout:        { icon: AlertTriangle, color: 'text-orange-400',  bgColor: 'bg-orange-500/15', label: 'Timeout' },
  cron_run:       { icon: Clock,         color: 'text-amber-400',   bgColor: 'bg-amber-500/15',  label: 'Cron' },
  cron_failed:    { icon: XCircle,       color: 'text-red-400',     bgColor: 'bg-red-500/15',    label: 'Cron Failed' },
  session_opened: { icon: GitBranch,     color: 'text-blue-400',    bgColor: 'bg-blue-500/15',   label: 'Opened' },
  session_closed: { icon: XCircle,       color: 'text-gray-400',    bgColor: 'bg-gray-500/15',   label: 'Closed' },
  model_changed:  { icon: Bot,           color: 'text-cyan-400',    bgColor: 'bg-cyan-500/15',   label: 'Model' },
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function formatRelativeTime(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function EventRow({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false)
  const { carMode } = useCarMode()
  const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.session_opened
  const Icon = config.icon

  const duration = event.metadata?.duration_seconds as number | undefined
  const result = event.metadata?.result as string | undefined
  const error = event.metadata?.error as string | undefined

  return (
    <div
      className={`group relative ${carMode ? 'py-3' : 'py-2'}`}
      role="listitem"
    >
      {/* Timeline line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-dashbot-border/30 group-first:top-3 group-last:bottom-auto group-last:h-3 car:left-[13px]" />

      <div
        className={`flex items-start gap-2.5 sm:gap-3 cursor-pointer ${carMode ? 'min-h-[48px]' : ''}`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        {/* Event icon */}
        <div className={`relative z-10 flex items-center justify-center shrink-0 w-[22px] h-[22px] car:w-[26px] car:h-[26px] rounded-full ${config.bgColor}`}>
          <Icon className={`size-3 car:size-3.5 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] sm:text-xs car:text-sm font-semibold ${config.color}`}>
              {config.label}
            </span>
            {event.agent_label && (
              <span className="text-[11px] sm:text-xs car:text-sm font-medium text-dashbot-text truncate">
                {event.agent_label}
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] car:text-xs text-dashbot-muted ml-auto shrink-0">
              {carMode ? formatRelativeTime(event.created_at) : formatTime(event.created_at)}
            </span>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-[10px] sm:text-[11px] car:text-xs text-dashbot-muted mt-0.5 truncate">
              {event.description}
            </p>
          )}

          {/* Inline metadata (model + duration) */}
          <div className="flex items-center gap-3 mt-1">
            {event.model && (
              <span className="text-[9px] sm:text-[10px] car:text-xs text-dashbot-primary font-mono">
                {event.model}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] car:text-xs text-dashbot-muted">
                <Timer className="size-2.5" />
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron (non-car) */}
        {!carMode && (result || error) && (
          <div className="shrink-0 mt-0.5">
            {expanded
              ? <ChevronDown className="size-3 text-dashbot-muted" />
              : <ChevronRight className="size-3 text-dashbot-muted" />}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && !carMode && (result || error) && (
        <div className="ml-8 mt-1.5 p-2 rounded bg-[rgba(255,255,255,0.03)] border border-dashbot-border/20 text-[10px] sm:text-xs">
          {result && (
            <p className="text-dashbot-text">
              <span className="text-dashbot-muted">Result: </span>
              {result}
            </p>
          )}
          {error && (
            <p className="text-red-400">
              <span className="text-dashbot-muted">Error: </span>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AgentActivityLog({ initialEvents }: Props) {
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents)
  const { carMode } = useCarMode()
  const scrollRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<Subscription | null>(null)

  // Subscribe to AgentEventsChannel for real-time updates
  useEffect(() => {
    subscriptionRef.current = cable.subscriptions.create(
      { channel: 'AgentEventsChannel' },
      {
        received(payload: { type: string; event?: AgentEvent }) {
          if (payload.type === 'new_event' && payload.event) {
            setEvents(prev => {
              const updated = [payload.event!, ...prev]
              // Keep max 100 events in UI
              return updated.slice(0, 100)
            })
          }
        },
      }
    )

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  const hasEvents = events.length > 0

  return (
    <Card className={carMode ? 'car:border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-dashbot-text">
          <Activity className="size-4 sm:size-5 car:size-6 text-dashbot-primary" />
          <span className="car:text-lg">Activity Log</span>
          <HelpButton topic="Activity Log" context={`Activity log showing ${events.length} recent events. This is a real-time feed of agent events including sub-agent spawns, completions, cron runs, session changes. What do these events mean?`} />
        </CardTitle>
        <CardDescription className="car:text-sm">
          {hasEvents
            ? `${events.length} recent event${events.length !== 1 ? 's' : ''}`
            : 'No events yet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasEvents ? (
          <div
            ref={scrollRef}
            className={`space-y-0 ${carMode ? 'max-h-none' : 'max-h-80 sm:max-h-96'} overflow-y-auto`}
            role="list"
            aria-label="Agent activity events"
          >
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-dashbot-muted">
            <Activity className="size-8 mb-2 opacity-30" />
            <p className="text-xs sm:text-sm">Agent events will appear here in real-time</p>
            <p className="text-[10px] sm:text-xs mt-1 opacity-60">
              Sub-agent spawns, completions, cron runs...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
