import { useEffect } from 'react'
import { X } from 'lucide-react'
import AgentList from './AgentList'
import CronList from './CronList'
import SessionList from './SessionList'
import type { SidebarData, DetailSelection } from '@/types/sidebar'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  data: SidebarData
  connected: boolean
  selection: DetailSelection | null
  onSelect: (selection: DetailSelection) => void
}

export default function MobileDrawer({ open, onClose, data, connected, selection, onSelect }: MobileDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSelect = (sel: DetailSelection) => {
    onSelect(sel)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-dashbot-bg border-r border-dashbot-border flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Agent sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dashbot-border">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-light tracking-wider uppercase text-dashbot-text">
              DashBot
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected
                  ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                  : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
              }`}
            />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface transition-colors"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* All content scrolls together — Agents, Crons, Sessions */}
        <div className="flex-1 overflow-y-auto">
          <AgentList
            mainAgent={data.mainAgent}
            subAgents={data.subAgents}
            sessions={data.sessions}
            selection={selection}
            onSelect={handleSelect}
          />

          <CronList crons={data.crons} selection={selection} onSelect={handleSelect} />
          <SessionList sessions={data.sessions} selection={selection} onSelect={handleSelect} />
        </div>
      </div>
    </>
  )
}
