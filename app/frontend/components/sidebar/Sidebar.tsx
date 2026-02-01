import AgentList from './AgentList'
import CronList from './CronList'
import SessionList from './SessionList'
import type { SidebarData, DetailSelection } from '@/types/sidebar'

interface SidebarProps {
  data: SidebarData
  connected: boolean
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function Sidebar({ data, selection, onSelect }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-zinc-950 border-r border-zinc-800/50 shrink-0">
      {/* Everything scrolls together — Agents, Crons, Sessions */}
      <div className="flex-1 overflow-y-auto">
        <AgentList
          mainAgent={data.mainAgent}
          subAgents={data.subAgents}
          sessions={data.sessions}
          selection={selection}
          onSelect={onSelect}
        />

        <CronList
          crons={data.crons}
          selection={selection}
          onSelect={onSelect}
        />
        <SessionList
          sessions={data.sessions}
          selection={selection}
          onSelect={onSelect}
        />
      </div>
    </aside>
  )
}
