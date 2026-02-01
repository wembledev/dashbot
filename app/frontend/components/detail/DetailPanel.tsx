import { MainAgentDetail, SubAgentDetail } from './AgentDetail'
import CronDetail from './CronDetail'
import SessionDetail from './SessionDetail'
import CronListView from './CronListView'
import SessionListView from './SessionListView'
import { Bot, Layers } from 'lucide-react'
import type { SidebarData, DetailSelection } from '@/types/sidebar'

interface DetailPanelProps {
  selection: DetailSelection | null
  data: SidebarData
  onSelectionChange: (selection: DetailSelection | null) => void
}

export default function DetailPanel({ selection, data, onSelectionChange }: DetailPanelProps) {
  if (!selection || selection.type === 'none') {
    return <EmptyState />
  }

  const navigateToAgent = (label: string) => {
    if (label === 'main' || label === 'Main Agent') {
      onSelectionChange({ type: 'agent-main', id: 'main' })
    } else {
      onSelectionChange({ type: 'agent-sub', id: label })
    }
  }

  switch (selection.type) {
    case 'agent-main':
      return (
        <MainAgentDetail
          data={data}
          onNavigateToAgent={navigateToAgent}
        />
      )

    case 'agent-sub': {
      const agent = data.subAgents.find(a => a.label === selection.id)
      if (!agent) return <NotFound label={selection.id} />
      return (
        <SubAgentDetail
          agent={agent}
          onNavigateToMain={() => onSelectionChange({ type: 'agent-main', id: 'main' })}
        />
      )
    }

    case 'cron-list':
      return (
        <CronListView
          crons={data.crons}
          onSelectCron={(sel) => onSelectionChange(sel)}
        />
      )

    case 'cron': {
      const cron = data.crons.find(c => c.id === selection.id)
      if (!cron) return <NotFound label={selection.id} />
      return <CronDetail cron={cron} onBack={() => onSelectionChange({ type: 'cron-list', id: 'crons' })} />
    }

    case 'session-list':
      return (
        <SessionListView
          sessions={data.sessions}
          onSelectSession={(sel) => onSelectionChange(sel)}
        />
      )

    case 'session': {
      const session = data.sessions.find(s => s.key === selection.id)
      if (!session) return <NotFound label={selection.id} />
      return <SessionDetail session={session} onBack={() => onSelectionChange({ type: 'session-list', id: 'sessions' })} />
    }

    default:
      return <EmptyState />
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
        <Layers className="size-7 text-zinc-600" />
      </div>
      <p className="text-base text-zinc-400 font-medium">Select an item</p>
      <p className="text-sm text-zinc-600 mt-1 max-w-[200px]">
        Click an agent, cron, or session in the sidebar to view details
      </p>
    </div>
  )
}

function NotFound({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
        <Bot className="size-7 text-zinc-600" />
      </div>
      <p className="text-base text-zinc-400 font-medium">Item not found</p>
      <p className="text-sm text-zinc-600 mt-1">&ldquo;{label}&rdquo; is no longer available</p>
    </div>
  )
}
