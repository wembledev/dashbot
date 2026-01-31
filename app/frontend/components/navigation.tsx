import { router, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Activity, Settings, LogOut } from 'lucide-react'
import { useUnread } from '@/contexts/unread-context'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Chats', href: '/dashboard', icon: <MessageSquare className="size-4" /> },
  { label: 'Status', href: '/status', icon: <Activity className="size-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="size-4" /> },
]

interface NavigationProps {
  connected?: boolean
}

export default function Navigation({ connected }: NavigationProps = {}) {
  const { url } = usePage()
  const { unreadCount } = useUnread()

  const isActive = (href: string) => {
    if (href === '/dashboard') return url === '/' || url === '/dashboard' || url.startsWith('/dashboard')
    return url.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-dashbot-bg/80 backdrop-blur-md border-b border-dashbot-border">
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3">
        {/* Logo - smaller on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-base sm:text-lg md:text-xl font-light tracking-wider uppercase text-dashbot-text">
            DashBot
          </span>
          {connected !== undefined && (
            <span 
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                connected 
                  ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' 
                  : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
              }`}
              aria-label={connected ? 'Connected' : 'Disconnected'}
            />
          )}
        </div>

        {/* Nav Items - compact on mobile */}
        <nav className="flex items-center gap-0.5 sm:gap-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.visit(item.href)}
              className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-dashbot-primary text-white shadow-[0_0_12px_rgba(62,106,225,0.4)]'
                  : 'text-dashbot-muted hover:text-dashbot-text hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
              {/* Unread badge for Chats */}
              {item.label === 'Chats' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.delete('/logout')}
          className="text-dashbot-text hover:text-white hover:bg-[rgba(255,255,255,0.1)] px-1.5 sm:px-2"
        >
          <LogOut className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline ml-1">Logout</span>
        </Button>
      </div>
    </header>
  )
}
