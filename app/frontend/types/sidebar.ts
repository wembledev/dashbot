// Sidebar data types — shared between hook and components

export type AgentStatus = 'running' | 'idle' | 'completed' | 'failed' | 'timeout'

export interface SidebarAgent {
  label: string
  model: string | null
  status: AgentStatus
  task: string | null
  startedAt: string
  duration: string | null
  sessionKey: string | null
}

export interface SidebarSession {
  key: string
  type: 'main' | 'cron' | 'subagent' | 'dashbot' | 'channel' | 'unknown'
  label: string
  status: 'active' | 'idle' | 'completed' | 'failed'
  model: string
  contextPercent: number
  kind?: string
  channel?: string
  age?: string
  tokens?: string
}

export interface SidebarCron {
  id: string
  name: string
  schedule: string
  nextRun: string
  lastRun: string
  status: string
  enabled?: boolean
  target?: string
  payloadKind?: string
  payloadText?: string
}

export interface SidebarData {
  mainAgent: {
    model: string
    status: AgentStatus
    sessionAge: string
    running: boolean
    inputTokens?: string
    outputTokens?: string
    cacheReadTokens?: string
    cacheWriteTokens?: string
    contextPercent?: number
  }
  subAgents: SidebarAgent[]
  sessions: SidebarSession[]
  crons: SidebarCron[]
  metrics: {
    agentCount: number
    sessionCount: number
    cronCount: number
  }
}

// Detail view selection — which item is selected in the sidebar
export type DetailViewType = 'none' | 'agent-main' | 'agent-sub' | 'cron' | 'session' | 'cron-list' | 'session-list'

export interface DetailSelection {
  type: DetailViewType
  id: string // agent label, cron id, or session key
}
