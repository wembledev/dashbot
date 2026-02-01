import { Link, usePage } from '@inertiajs/react'
import { MessageSquare, Activity, Settings } from 'lucide-react'
import { useUnread } from '@/contexts/unread-context'

const tabs = [
  { label: 'Chat', href: '/dashboard', icon: MessageSquare },
  { label: 'Status', href: '/status', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function MobileNav() {
  const { url } = usePage()
  const { unreadCount } = useUnread()

  const isActive = (href: string) => {
    if (href === '/dashboard') return url === '/' || url === '/dashboard' || url.startsWith('/dashboard')
    return url.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/50 safe-area-bottom" role="navigation" aria-label="Mobile navigation">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors ${
              isActive(href)
                ? 'text-blue-400'
                : 'text-zinc-500 active:text-zinc-300'
            }`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{label}</span>
            {/* Unread badge for Chat */}
            {label === 'Chat' && unreadCount > 0 && (
              <span className="absolute -top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
