import AgentList from './AgentList'
import CronList from './CronList'
import SessionList from './SessionList'
import { Network } from 'lucide-react'
import type { SidebarData, DetailSelection } from '@/types/sidebar'

interface SidebarProps {
  data: SidebarData
  connected: boolean
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function Sidebar({ data, selection, onSelect }: SidebarProps) {
  const hasData = data.sessions.length > 0 || data.crons.length > 0 || data.mainAgent.running

  return (
    <aside className="hidden md:flex w-64 flex-col bg-dashbot-bg border-r border-dashbot-border shrink-0">
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-dashbot-muted">
          <Network className="size-6 mb-2 opacity-30" />
          <p className="text-xs text-center">Waiting for OpenClaw...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <AgentList
            mainAgent={data.mainAgent}
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
      )}
    </aside>
  )
}
