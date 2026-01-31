export interface SessionInfo {
  key: string
  kind: string
  model: string
  tokens: string
  context_percent: number
  age: string
  flags: string
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

export interface StatusData {
  agent_status: AgentStatusData
  token_burn: TokenBurnData
  tasks: TasksData
  memory: MemoryData
  session_health: SessionHealthData
  sessions: SessionInfo[]
  fetched_at: string
}
