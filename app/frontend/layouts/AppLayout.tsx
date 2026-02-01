import { useState, type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import Sidebar from '@/components/sidebar/Sidebar'
import TopBar from '@/components/topbar/TopBar'
import MobileDrawer from '@/components/sidebar/MobileDrawer'
import DetailPanel from '@/components/detail/DetailPanel'
import HelpDrawer from '@/components/help/HelpDrawer'
import { useAgentData } from '@/hooks/useAgentData'
import type { DetailSelection } from '@/types/sidebar'

interface AppLayoutProps {
  children: ReactNode
}

/**
 * Persistent SPA layout with sidebar + detail panel.
 *
 * Inertia.js keeps this mounted between page transitions, so the sidebar
 * (including WebSocket connections and scroll position) persists.
 *
 * When an item is selected in the sidebar, the content area shows a detail
 * view. Navigating via top bar tabs clears the selection and shows the
 * page content.
 *
 * Chat and Settings pages hide the sidebar for full-width layouts.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { data, connected } = useAgentData()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selection, setSelection] = useState<DetailSelection | null>(null)
  const { url } = usePage()

  // Clear detail selection when URL changes (fixes nav bug).
  // React-idiomatic: adjust state during render when props change.
  const [prevUrl, setPrevUrl] = useState(url)
  if (url !== prevUrl) {
    setPrevUrl(url)
    setSelection(null)
  }

  const handleSelectionChange = (sel: DetailSelection | null) => {
    setSelection(sel)
  }

  // Determine if we're showing the detail panel or the page content
  const showDetail = selection !== null && selection.type !== 'none'

  // Determine current page for layout decisions
  const isChat = url === '/' || url === '/dashboard' || url.startsWith('/dashboard')
  const isSettings = url === '/settings' || url.startsWith('/settings')
  const hideSidebar = isChat || isSettings

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* Top bar with nav — ALWAYS on top */}
      <TopBar
        data={data}
        connected={connected}
        onMenuToggle={() => setDrawerOpen(prev => !prev)}
        showMenuButton={!hideSidebar}
      />

      {/* Below top nav: sidebar + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar — below top nav, hidden on Chat & Settings */}
        {!hideSidebar && (
          <Sidebar
            data={data}
            connected={connected}
            selection={selection}
            onSelect={handleSelectionChange}
          />
        )}

        {/* Mobile drawer — only available when sidebar is shown */}
        {!hideSidebar && (
          <MobileDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            data={data}
            connected={connected}
            selection={selection}
            onSelect={handleSelectionChange}
          />
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {showDetail && !hideSidebar ? (
            <div className="h-full overflow-y-auto">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <DetailPanel
                  selection={selection}
                  data={data}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            </div>
          ) : isChat ? (
            children
          ) : (
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          )}
        </main>

        {/* Help drawer — persistent panel on the right, no backdrop */}
        <HelpDrawer />
      </div>
    </div>
  )
}
