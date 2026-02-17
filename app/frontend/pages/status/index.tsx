import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import AgentStatusWidget from '@/components/status/agent-status-widget'
import AgentHierarchyWidget from '@/components/status/agent-hierarchy-widget'
import AgentActivityLog from '@/components/status/agent-activity-log'
import TokenBurnWidget from '@/components/status/token-burn-widget'
import TasksWidget from '@/components/status/tasks-widget'
import MemoryWidget from '@/components/status/memory-widget'
import SessionHealthWidget from '@/components/status/session-health-widget'
import { useCarMode } from '@/contexts/car-mode-context'
import { RefreshCw, Car } from 'lucide-react'
import type { StatusData, AgentEvent } from '@/types/status'
import { cable } from '@/lib/cable'
import type { Subscription } from '@rails/actioncable'

interface Props {
  status_data: StatusData
  initial_events: AgentEvent[]
}

function CarModeToggle() {
  const { carMode, toggleCarMode } = useCarMode()

  return (
    <button
      onClick={toggleCarMode}
      className={`p-1.5 sm:p-2 car:p-3 rounded-full transition-colors ${
        carMode
          ? 'bg-blue-600 text-white'
          : 'text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface'
      }`}
      aria-label={carMode ? 'Disable car mode' : 'Enable car mode'}
      title={carMode ? 'Car mode ON' : 'Car mode OFF'}
    >
      <Car className="size-3.5 sm:size-4 car:size-5" />
    </button>
  )
}

function StatusContent({ status_data: initialData, initial_events: initialEvents }: Props) {
  const [data, setData] = useState<StatusData>(initialData)
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents || [])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [connected, setConnected] = useState(false)
  const [sessionActionError, setSessionActionError] = useState<string | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)
  const eventsSubRef = useRef<Subscription | null>(null)
  const { carMode } = useCarMode()

  const refreshData = useCallback(() => {
    setRefreshing(true)
    fetch('/status/poll', {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      credentials: 'same-origin',
    })
      .then(res => {
        if (res.status === 401) {
          router.visit('/login')
          return null
        }
        return res.json()
      })
      .then(json => {
        if (json) {
          setData(json)
          setLastRefresh(new Date())
        }
      })
      .catch(() => {})
      .finally(() => setRefreshing(false))
  }, [])

  const handleCloseSession = useCallback(async (sessionKey: string) => {
    setSessionActionError(null)

    try {
      const res = await fetch(`/status/sessions/${encodeURIComponent(sessionKey)}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
      })

      const payload = await res.json().catch(() => ({} as { error?: string; deleted?: boolean }))
      if (!res.ok || payload?.error || payload?.deleted !== true) {
        throw new Error(payload?.error || 'Session was not deleted')
      }

      setData(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.key !== sessionKey),
        agent_status: {
          ...prev.agent_status,
          session_count: Math.max(0, prev.agent_status.session_count - 1),
        },
      }))

      refreshData()
    } catch (err) {
      setSessionActionError(err instanceof Error ? err.message : 'Failed to close session')
    }
  }, [refreshData])

  // Subscribe to StatusChannel for real-time status updates
  useEffect(() => {
    subscriptionRef.current = cable.subscriptions.create(
      { channel: 'StatusChannel' },
      {
        connected() {
          setConnected(true)
        },
        disconnected() {
          setConnected(false)
        },
        received(payload: { type: string; data?: StatusData }) {
          if (payload.type === 'status_update' && payload.data) {
            setData(payload.data)
            setLastRefresh(new Date())
          }
        },
      }
    )

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  // Subscribe to AgentEventsChannel for live sub-agent updates
  useEffect(() => {
    eventsSubRef.current = cable.subscriptions.create(
      { channel: 'AgentEventsChannel' },
      {
        received(payload: { type: string; event?: AgentEvent }) {
          if (payload.type === 'new_event' && payload.event) {
            setEvents(prev => [payload.event!, ...prev].slice(0, 100))
          }
        },
      }
    )

    return () => {
      eventsSubRef.current?.unsubscribe()
      eventsSubRef.current = null
    }
  }, [])

  // Session keep-alive heartbeat every 60 seconds
  useEffect(() => {
    const keepAliveTimer = setInterval(() => {
      fetch('/status/keepalive', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin',
      }).catch(() => {})
    }, 60000)
    return () => clearInterval(keepAliveTimer)
  }, [])

  const timeSinceRefresh = useCallback(() => {
    const now = performance.timeOrigin + performance.now()
    const diff = Math.floor((now - lastRefresh.getTime()) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ago`
  }, [lastRefresh])

  return (
    <div className="h-full overflow-y-auto bg-dashbot-bg">
      <div className="px-2 sm:px-3 pb-3">
        <div>
          {/* Page header */}
          <div className="flex items-center justify-between mb-2 mt-2">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base car:text-3xl font-medium text-dashbot-text">
                Status
              </h1>
              {!carMode && (
                <span className="text-zinc-600 text-[10px]">
                  <span className={connected ? 'text-green-400' : 'text-yellow-400'}>●</span> {timeSinceRefresh()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <CarModeToggle />
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-1 car:p-3 rounded hover:bg-dashbot-surface transition-colors text-dashbot-muted hover:text-dashbot-text disabled:opacity-50"
                aria-label="Refresh status"
              >
                <RefreshCw className={`size-3.5 car:size-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {sessionActionError && (
            <div className="mb-2 rounded border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-xs text-red-300">
              {sessionActionError}
            </div>
          )}

          {/* Status grid */}
          {carMode ? (
            <div className="space-y-3">
              <AgentStatusWidget data={data.agent_status} events={events} />
              <AgentHierarchyWidget
                data={data.agent_status}
                sessions={data.sessions}
                events={events}
                onCloseSession={handleCloseSession}
              />
              <TasksWidget data={data.tasks} />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Top row: Hierarchy + Activity Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <AgentHierarchyWidget
                  data={data.agent_status}
                  sessions={data.sessions}
                  events={events}
                  onCloseSession={handleCloseSession}
                />
                <AgentActivityLog initialEvents={events} />
              </div>

              {/* Bottom row: Supporting widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                <TokenBurnWidget data={data.token_burn} sessions={data.sessions} />
                <SessionHealthWidget data={data.session_health} sessions={data.sessions} />
                <TasksWidget data={data.tasks} />
                <MemoryWidget data={data.memory} />
              </div>
            </div>
          )}

          {/* Footer timestamp */}
          {!carMode && (
            <div className="mt-2 text-center text-zinc-600 text-[9px] font-mono">
              {data.fetched_at}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StatusIndex(props: Props) {
  return <StatusContent {...props} />
}
