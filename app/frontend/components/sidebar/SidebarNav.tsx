import { Link, usePage } from '@inertiajs/react'
import { MessageSquare, Activity, Settings, LogOut } from 'lucide-react'
import { router } from '@inertiajs/react'
import { useUnread } from '@/contexts/unread-context'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Chat', href: '/dashboard', icon: <MessageSquare className="size-4" /> },
  { label: 'Status', href: '/status', icon: <Activity className="size-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="size-4" /> },
]

export default function SidebarNav() {
  const { url } = usePage()
  const { unreadCount } = useUnread()

  const isActive = (href: string) => {
    if (href === '/dashboard') return url === '/' || url === '/dashboard' || url.startsWith('/dashboard')
    return url.startsWith(href)
  }

  return (
    <nav className="px-2 py-2 border-t border-dashbot-border space-y-0.5" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isActive(item.href)
              ? 'bg-blue-500/15 text-blue-400'
              : 'text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface'
          }`}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {item.icon}
          {item.label}
          {/* Unread badge for Chat */}
          {item.label === 'Chat' && unreadCount > 0 && (
            <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      ))}

      {/* Logout */}
      <button
        onClick={() => router.delete('/logout')}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-dashbot-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <LogOut className="size-4" />
        Logout
      </button>
    </nav>
  )
}
