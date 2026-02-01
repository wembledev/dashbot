export interface SessionInfo {
  key: string
  kind: string
  model: string
  tokens: string
  context_percent: number
  age: string
  flags: string
}

// Parsed session type for UI display
export type SessionType = 'main' | 'cron' | 'subagent' | 'dashbot' | 'channel' | 'unknown'
export type SessionStatus = 'active' | 'idle' | 'completed' | 'failed'
export type SessionSafety = 'safe' | 'caution' | 'unsafe'

export interface ParsedSession extends SessionInfo {
  type: SessionType
  label: string
  description: string
  status: SessionStatus
  safety: SessionSafety
  safetyReason: string
  parentKey?: string  // for sub-agents, the parent session key
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  next_run: string
  last_run: string
  status: string
  target: string
  agent: string
  error?: string
  enabled?: boolean
  payload_kind?: string
  payload_text?: string
}

export interface CronError {
  job_name: string
  error: string
  timestamp: number
}

export interface AgentStatusData {
  running: boolean
  session_count: number
  main_session_age: string
  main_model: string
}

export interface TokenBurnData {
  main_tokens: string
  main_context_percent: number
  total_sessions: number
  model: string
}

export interface TasksData {
  cron_jobs: CronJob[]
  pending_count: number
  next_job: string | null
  cron_health: "healthy" | "degraded" | "failing"
  cron_errors: CronError[]
}

export interface MemoryCollection {
  name: string
  pattern: string
  files: number
  updated: string
}

export interface MemoryData {
  backend: "qmd" | "openclaw"
  // Shared
  file_count: number
  // qmd fields
  vector_count: number
  index_size: string
  updated: string
  collections: MemoryCollection[]
  // openclaw fields
  chunk_count: number
  dirty: boolean
  sources: string
  vector_ready: boolean
  fts_ready: boolean
  cache_count: number
}

export interface SessionHealthData {
  uptime: string
  model: string
  context_percent: number
  tokens: string
  session_key: string
}

// Agent Events
export interface AgentEvent {
  id: number
  event_type: string
  agent_label: string | null
  session_key: string | null
  model: string | null
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface StatusData {
  agent_status: AgentStatusData
  token_burn: TokenBurnData
  tasks: TasksData
  memory: MemoryData
  session_health: SessionHealthData
  sessions: SessionInfo[]
  fetched_at: string
}
