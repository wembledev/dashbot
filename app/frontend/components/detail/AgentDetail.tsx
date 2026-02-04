import { Bot, Zap } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import type { SidebarData, SidebarAgent, AgentStatus } from '@/types/sidebar'

const STATUS_LABEL: Record<AgentStatus, { label: string; color: string }> = {
  running:   { label: 'Online',    color: 'text-green-400' },
  idle:      { label: 'Idle',      color: 'text-yellow-400' },
  completed: { label: 'Completed', color: 'text-blue-400' },
  failed:    { label: 'Failed',    color: 'text-red-400' },
  timeout:   { label: 'Timeout',   color: 'text-orange-400' },
}

const STATUS_DOT: Record<AgentStatus, string> = {
  running:   'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]',
  idle:      'bg-yellow-500',
  completed: 'bg-blue-500',
  failed:    'bg-red-500',
  timeout:   'bg-orange-500',
}

function formatDuration(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

interface SubAgentRowProps {
  agent: SidebarAgent
  onNavigate: (label: string) => void
}

function SubAgentRow({ agent, onNavigate }: SubAgentRowProps) {
  const statusConfig = STATUS_LABEL[agent.status]

  return (
    <button
      onClick={() => onNavigate(agent.label)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dashbot-surface transition-colors text-left group"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[agent.status]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-dashbot-text font-medium truncate">{agent.label}</span>
          {agent.model && (
            <span className="text-xs text-dashbot-muted font-mono shrink-0">{agent.model}</span>
          )}
        </div>
        {agent.task && (
          <p className="text-xs text-dashbot-muted truncate mt-0.5">{agent.task}</p>
        )}
      </div>
      <span className={`text-xs shrink-0 ${statusConfig.color}`}>
        {agent.status === 'running' ? formatDuration(agent.startedAt) : agent.duration || statusConfig.label}
      </span>
    </button>
  )
}

interface MainAgentDetailProps {
  data: SidebarData
  onNavigateToAgent: (label: string) => void
}

export function MainAgentDetail({ data, onNavigateToAgent }: MainAgentDetailProps) {
  const { mainAgent, subAgents } = data
  const statusConfig = STATUS_LABEL[mainAgent.status]
  const runningAgents = subAgents.filter(a => a.status === 'running')
  const recentAgents = subAgents.filter(a => a.status !== 'running').slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Bot className="size-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-dashbot-text">Main Agent</h2>
            <p className="text-xs text-dashbot-muted font-mono">{mainAgent.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[mainAgent.status]}`} />
          <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Uptime" value={mainAgent.running ? mainAgent.sessionAge : 'Stopped'} />
        <InfoCard label="Model" value={mainAgent.model} mono />
        {mainAgent.contextPercent !== undefined && (
          <InfoCard label="Context Used" value={`${mainAgent.contextPercent}%`} />
        )}
        {mainAgent.inputTokens && (
          <InfoCard label="Tokens" value={mainAgent.inputTokens} />
        )}
      </div>

      {/* Token Usage */}
      {mainAgent.inputTokens && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-dashbot-text">Token Usage</h3>
            <HelpButton
              topic="Token Usage"
              context={`Main Agent token usage: model=${mainAgent.model}, tokens=${mainAgent.inputTokens}, context window at ${mainAgent.contextPercent}%. What do these numbers mean? When should I be concerned?`}
            />
          </div>
          <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dashbot-muted">Total Tokens</span>
              <span className="text-dashbot-text font-mono">{mainAgent.inputTokens}</span>
            </div>
            {mainAgent.contextPercent !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-dashbot-muted mb-1.5">
                  <span>Context Window</span>
                  <span>{mainAgent.contextPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-dashbot-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      mainAgent.contextPercent > 80 ? 'bg-red-500' :
                      mainAgent.contextPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(mainAgent.contextPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sub-Agents */}
      {(runningAgents.length > 0 || recentAgents.length > 0) && (
        <section>
          <h3 className="text-sm font-medium text-dashbot-text mb-3">
            Sub-Agents ({subAgents.length})
          </h3>
          <div className="bg-dashbot-surface rounded-xl border border-dashbot-border divide-y divide-dashbot-border">
            {runningAgents.map(agent => (
              <SubAgentRow
                key={agent.label + agent.startedAt}
                agent={agent}
                onNavigate={onNavigateToAgent}
              />
            ))}
            {recentAgents.map(agent => (
              <SubAgentRow
                key={agent.label + agent.startedAt}
                agent={agent}
                onNavigate={onNavigateToAgent}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface SubAgentDetailProps {
  agent: SidebarAgent
  onNavigateToMain: () => void
}

export function SubAgentDetail({ agent, onNavigateToMain }: SubAgentDetailProps) {
  const statusConfig = STATUS_LABEL[agent.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            agent.status === 'running' ? 'bg-green-500/10' :
            agent.status === 'completed' ? 'bg-blue-500/10' :
            agent.status === 'failed' ? 'bg-red-500/10' : 'bg-dashbot-surface'
          }`}>
            <Zap className={`size-5 ${statusConfig.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-dashbot-text">{agent.label}</h2>
            {agent.model && (
              <p className="text-xs text-dashbot-muted font-mono">{agent.model}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[agent.status]}`} />
          <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        {agent.model && <InfoCard label="Model" value={agent.model} mono />}
        <InfoCard
          label={agent.status === 'running' ? 'Running For' : 'Duration'}
          value={agent.status === 'running' ? formatDuration(agent.startedAt) : (agent.duration || '—')}
        />
        <InfoCard label="Status" value={statusConfig.label} />
        <InfoCard label="Started" value={new Date(agent.startedAt).toLocaleTimeString()} />
      </div>

      {/* Task */}
      {agent.task && (
        <section>
          <h3 className="text-sm font-medium text-dashbot-text mb-3">Current Task</h3>
          <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-4">
            <p className="text-sm text-dashbot-text">{agent.task}</p>
          </div>
        </section>
      )}

      {/* Parent link */}
      <section>
        <button
          onClick={onNavigateToMain}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to Main Agent
        </button>
      </section>
    </div>
  )
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-dashbot-surface rounded-xl border border-dashbot-border p-3">
      <p className="text-xs text-dashbot-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-dashbot-text truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
