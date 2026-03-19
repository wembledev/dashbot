import { useState, useEffect, useCallback, useRef } from 'react'
import { cable } from '@/lib/cable'
import type { Subscription } from '@rails/actioncable'
import type { SidebarData, SidebarSession, SidebarCron } from '@/types/sidebar'
import type { StatusData } from '@/types/status'
import { parseSessionType } from '@/lib/sessions'

/** Map sessions to sidebar-friendly format */
function mapSessions(sessions: StatusData['sessions']): SidebarSession[] {
  return sessions.map(s => {
    const type = parseSessionType(s.key)
    const label = (() => {
      const parts = s.key.split(':')
      if (type === 'main') return 'Main Session'
      if (type === 'dashbot') return 'DashBot Chat'
      if (type === 'cron') {
        const name = parts.slice(3).join(':')
        return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }
      if (type === 'channel') {
        const name = parts.slice(3).join(':')
        return name.charAt(0).toUpperCase() + name.slice(1)
      }
      if (type === 'subagent') {
        const id = parts.slice(3).join(':')
        return `Sub: ${id.slice(0, 8)}`
      }
      return s.key
    })()

    // Infer channel from key
    const channel = (() => {
      if (type === 'channel') {
        const parts = s.key.split(':')
        return parts[3] || undefined
      }
      return undefined
    })()

    // Infer status
    let status: SidebarSession['status'] = 'active'
    if (s.context_percent > 95) status = 'failed'
    else {
      const ageMatch = s.age.match(/(\d+)([hmd])/)
      if (ageMatch) {
        const value = parseInt(ageMatch[1])
        const unit = ageMatch[2]
        if ((unit === 'h' && value >= 2) || unit === 'd') status = 'idle'
      }
    }

    return {
      key: s.key,
      type,
      label,
      status,
      model: s.model,
      contextPercent: s.context_percent,
      kind: s.kind,
      channel,
      age: s.age,
      tokens: s.tokens,
    }
  })
}

/** Map crons from status data */
function mapCrons(tasks: StatusData['tasks']): SidebarCron[] {
  return tasks.cron_jobs.map(c => ({
    id: c.id,
    name: c.name,
    schedule: c.schedule,
    nextRun: c.next_run,
    lastRun: c.last_run,
    status: c.status,
    enabled: c.enabled,
    target: c.target,
    payloadKind: c.payload_kind,
    payloadText: c.payload_text,
  }))
}

const EMPTY_DATA: SidebarData = {
  mainAgent: {
    model: 'unknown',
    status: 'idle',
    sessionAge: 'unknown',
    running: false,
  },
  subAgents: [],
  sessions: [],
  crons: [],
  metrics: {
    agentCount: 0,
    sessionCount: 0,
    cronCount: 0,
  },
}

/**
 * Hook that provides live agent/session/cron data for the sidebar.
 * Uses StatusChannel for real-time status updates.
 * Falls back to polling /status/poll every 30s.
 */
export function useAgentData(): {
  data: SidebarData
  connected: boolean
  refresh: () => void
} {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [connected, setConnected] = useState(false)
  const statusSubRef = useRef<Subscription | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(() => {
    fetch('/status/poll', {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      credentials: 'same-origin',
    })
      .then(res => {
        if (res.ok) return res.json()
        return null
      })
      .then(json => {
        if (json) setStatusData(json)
      })
      .catch(() => {})
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Subscribe to StatusChannel
  useEffect(() => {
    statusSubRef.current = cable.subscriptions.create(
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
            setStatusData(payload.data)
          }
        },
      }
    )

    return () => {
      statusSubRef.current?.unsubscribe()
      statusSubRef.current = null
    }
  }, [])

  // Poll fallback every 30s
  useEffect(() => {
    pollTimerRef.current = setInterval(fetchStatus, 30_000)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [fetchStatus])

  // Build sidebar data from status
  const data: SidebarData = statusData
    ? {
        mainAgent: {
          model: statusData.agent_status.main_model,
          status: statusData.agent_status.running ? 'running' : 'idle',
          sessionAge: statusData.agent_status.main_session_age,
          running: statusData.agent_status.running,
          inputTokens: statusData.token_burn.main_tokens,
          contextPercent: statusData.token_burn.main_context_percent,
        },
        subAgents: [],
        sessions: mapSessions(statusData.sessions),
        crons: mapCrons(statusData.tasks),
        metrics: {
          agentCount: statusData.agent_status.running ? 1 : 0,
          sessionCount: statusData.agent_status.session_count,
          cronCount: statusData.tasks.cron_jobs.length,
        },
      }
    : EMPTY_DATA

  return { data, connected, refresh: fetchStatus }
}
