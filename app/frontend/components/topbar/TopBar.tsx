import { Link, usePage } from '@inertiajs/react'
import { MessageSquare, Activity, Settings, Menu } from 'lucide-react'
import { useUnread } from '@/contexts/unread-context'
import type { SidebarData } from '@/types/sidebar'

interface TopBarProps {
  data: SidebarData
  connected: boolean
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

const navItems = [
  { label: 'Chat', href: '/dashboard', icon: MessageSquare },
  { label: 'Status', href: '/status', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function TopBar({ connected, onMenuToggle, showMenuButton = true }: TopBarProps) {
  const { url } = usePage()
  const { unreadCount } = useUnread()

  const isActive = (href: string) => {
    if (href === '/dashboard') return url === '/' || url === '/dashboard' || url.startsWith('/dashboard')
    return url.startsWith(href)
  }

  return (
    <header className="flex items-center justify-between px-3 sm:px-4 py-2 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 shrink-0">
      {/* Left: mobile menu + logo + connection dot */}
      <div className="flex items-center gap-2.5">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-5" />
          </button>
        )}
        <span className="text-sm font-light tracking-wider uppercase text-zinc-200">
          DashBot
        </span>
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            connected
              ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
              : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
          }`}
          aria-label={connected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Center: Nav tabs */}
      <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive(href)
                ? 'bg-blue-500/15 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {/* Unread badge for Chat */}
            {label === 'Chat' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Right: spacer to balance layout */}
      <div className="w-16" />
    </header>
  )
}
