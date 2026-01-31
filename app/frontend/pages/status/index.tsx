import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import Navigation from '@/components/navigation'
import AgentStatusWidget from '@/components/status/agent-status-widget'
import TokenBurnWidget from '@/components/status/token-burn-widget'
import TasksWidget from '@/components/status/tasks-widget'
import MemoryWidget from '@/components/status/memory-widget'
import SessionHealthWidget from '@/components/status/session-health-widget'
import { RefreshCw } from 'lucide-react'
import type { StatusData } from '@/types/status'
import { cable } from '@/lib/cable'
import type { Subscription } from '@rails/actioncable'

interface Props {
  status_data: StatusData
}

export default function StatusIndex({ status_data: initialData }: Props) {
  const [data, setData] = useState<StatusData>(initialData)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [connected, setConnected] = useState(false)
  const subscriptionRef = useRef<Subscription | null>(null)

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
      .catch(() => {
        // Silently fail - manual refresh
      })
      .finally(() => {
        setRefreshing(false)
      })
  }, [])

  // Subscribe to StatusChannel for real-time updates
  useEffect(() => {
    console.log('[status] Subscribing to StatusChannel')
    
    subscriptionRef.current = cable.subscriptions.create(
      { channel: 'StatusChannel' },
      {
        connected() {
          console.log('[status] StatusChannel connected')
          setConnected(true)
        },
        disconnected() {
          console.log('[status] StatusChannel disconnected')
          setConnected(false)
        },
        received(payload: { type: string; data?: StatusData }) {
          if (payload.type === 'status_update' && payload.data) {
            console.log('[status] Received status update')
            setData(payload.data)
            setLastRefresh(new Date())
          }
        },
      }
    )

    return () => {
      console.log('[status] Unsubscribing from StatusChannel')
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
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
    <div className="min-h-screen bg-dashbot-bg">
      <Navigation />

      <main className="pt-14 px-2 sm:px-4 md:px-6 pb-4 sm:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page header - compact on mobile */}
          <div className="flex items-center justify-between mb-3 sm:mb-6 mt-2 sm:mt-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-light text-dashbot-text tracking-wide">
                Agent Status
              </h1>
              <p className="text-dashbot-muted text-[11px] sm:text-sm mt-0.5 sm:mt-1">
                Real-time agent monitoring dashboard
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-dashbot-muted text-[10px] sm:text-xs hidden sm:block">
                <span className={connected ? 'text-green-400' : 'text-yellow-400'}>●</span> Updated {timeSinceRefresh()}
              </span>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-1.5 sm:p-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors text-dashbot-muted hover:text-dashbot-text disabled:opacity-50"
                aria-label="Refresh status"
              >
                <RefreshCw className={`size-3.5 sm:size-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status grid - single column on mobile, responsive on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
            <AgentStatusWidget data={data.agent_status} />
            <TokenBurnWidget data={data.token_burn} />
            <SessionHealthWidget data={data.session_health} sessions={data.sessions} />
            <TasksWidget data={data.tasks} />
            <MemoryWidget data={data.memory} />
          </div>

          {/* Footer timestamp */}
          <div className="mt-3 sm:mt-6 text-center text-dashbot-muted text-[10px] sm:text-xs">
            Data fetched at {data.fetched_at}
          </div>
        </div>
      </main>
    </div>
  )
}
