import { Bot, Zap, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import type { SidebarAgent, SidebarSession, AgentStatus, DetailSelection } from '@/types/sidebar'

const STATUS_CONFIG: Record<AgentStatus, { icon: typeof Zap; color: string; dotColor: string }> = {
  running:   { icon: Zap,             color: 'text-green-400',  dotColor: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' },
  idle:      { icon: Clock,           color: 'text-yellow-400', dotColor: 'bg-yellow-500' },
  completed: { icon: CheckCircle,     color: 'text-blue-400',   dotColor: 'bg-blue-500' },
  failed:    { icon: XCircle,         color: 'text-red-400',    dotColor: 'bg-red-500' },
  timeout:   { icon: AlertTriangle,   color: 'text-orange-400', dotColor: 'bg-orange-500' },
}

function formatRunningDuration(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

interface SubAgentCardProps {
  agent: SidebarAgent
  session?: SidebarSession
  selected: boolean
  onSelect: () => void
}

function SubAgentCard({ agent, session, selected, onSelect }: SubAgentCardProps) {
  const config = STATUS_CONFIG[agent.status]
  const Icon = config.icon

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left group pl-4 pr-3 py-2 rounded-lg cursor-pointer transition-colors border-l-2 border-l-violet-500/40 ml-3 ${
        selected
          ? 'bg-blue-500/10 border border-blue-500/20 !border-l-2 !border-l-violet-500'
          : 'hover:bg-zinc-800/50 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
        {/* Label */}
        <span className="text-sm font-medium text-zinc-200 truncate flex-1">
          {agent.label}
        </span>
        {/* Status icon */}
        <Icon className={`size-3 shrink-0 ${config.color}`} />
      </div>
      <div className="flex items-center gap-2 ml-4 mt-0.5">
        {agent.model && (
          <span className="text-xs text-zinc-500 font-mono">{agent.model}</span>
        )}
        {agent.model && agent.task && (
          <span className="text-xs text-zinc-700">·</span>
        )}
        {agent.task && (
          <span className="text-xs text-zinc-500 truncate">{agent.task}</span>
        )}
        {!agent.task && agent.status === 'running' && (
          <span className="text-xs text-zinc-500">{formatRunningDuration(agent.startedAt)}</span>
        )}
        {agent.duration && agent.status !== 'running' && (
          <span className="text-xs text-zinc-500">{agent.duration}</span>
        )}
      </div>
      {/* Token usage bar */}
      {session && session.contextPercent > 0 && (
        <div className="ml-4 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  session.contextPercent > 80 ? 'bg-red-500' :
                  session.contextPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(session.contextPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-600 font-mono w-7 text-right">{session.contextPercent}%</span>
          </div>
        </div>
      )}
    </button>
  )
}

interface MainAgentCardProps {
  model: string
  status: AgentStatus
  sessionAge: string
  running: boolean
  contextPercent?: number
  selected: boolean
  onSelect: () => void
}

function MainAgentCard({ model, status, sessionAge, running, contextPercent, selected, onSelect }: MainAgentCardProps) {
  const config = STATUS_CONFIG[status]

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
        selected
          ? 'bg-blue-500/10 border border-blue-500/20'
          : 'bg-zinc-800/30 border border-zinc-800/50 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <Bot className="size-4 text-green-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-200 flex-1">Main Agent</span>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.dotColor}`} />
      </div>
      <div className="flex items-center gap-2 ml-6 mt-0.5">
        <span className="text-xs text-blue-400 font-mono">{model}</span>
        <span className="text-xs text-zinc-700">·</span>
        <span className="text-xs text-zinc-500">
          {running ? `up ${sessionAge}` : 'stopped'}
        </span>
      </div>
      {/* Context bar for main agent */}
      {contextPercent !== undefined && contextPercent > 0 && (
        <div className="ml-6 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  contextPercent > 80 ? 'bg-red-500' :
                  contextPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(contextPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-600 font-mono w-7 text-right">{contextPercent}%</span>
          </div>
        </div>
      )}
    </button>
  )
}

interface AgentListProps {
  mainAgent: {
    model: string
    status: AgentStatus
    sessionAge: string
    running: boolean
    contextPercent?: number
  }
  subAgents: SidebarAgent[]
  sessions: SidebarSession[]
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function AgentList({ mainAgent, subAgents, sessions, selection, onSelect }: AgentListProps) {
  const runningAgents = subAgents.filter(a => a.status === 'running')
  const completedAgents = subAgents.filter(a => a.status !== 'running')

  // Cross-reference sub-agents with sessions for token data
  const sessionByKey = new Map(sessions.map(s => [s.key, s]))

  return (
    <div className="px-2 py-2 space-y-1">
      {/* Section label */}
      <div className="px-2 py-1">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Agents
        </span>
      </div>

      {/* Main agent */}
      <MainAgentCard
        {...mainAgent}
        selected={selection?.type === 'agent-main'}
        onSelect={() => onSelect({ type: 'agent-main', id: 'main' })}
      />

      {/* Running sub-agents — indented */}
      {runningAgents.map(agent => (
        <SubAgentCard
          key={agent.label + agent.startedAt}
          agent={agent}
          session={agent.sessionKey ? sessionByKey.get(agent.sessionKey) : undefined}
          selected={selection?.type === 'agent-sub' && selection.id === agent.label}
          onSelect={() => onSelect({ type: 'agent-sub', id: agent.label })}
        />
      ))}

      {/* Completed/failed sub-agents — indented (last 5) */}
      {completedAgents.length > 0 && (
        <>
          <div className="px-2 pt-2 ml-3">
            <span className="text-xs text-zinc-600">
              Recent ({completedAgents.length})
            </span>
          </div>
          {completedAgents.slice(0, 5).map(agent => (
            <SubAgentCard
              key={agent.label + agent.startedAt}
              agent={agent}
              session={agent.sessionKey ? sessionByKey.get(agent.sessionKey) : undefined}
              selected={selection?.type === 'agent-sub' && selection.id === agent.label}
              onSelect={() => onSelect({ type: 'agent-sub', id: agent.label })}
            />
          ))}
        </>
      )}
    </div>
  )
}
