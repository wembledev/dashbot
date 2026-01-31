import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { cable } from '@/lib/cable'
import type { Subscription } from '@rails/actioncable'

interface UnreadContextValue {
  unreadCount: number
  incrementUnread: () => void
  clearUnread: () => void
}

const UnreadContext = createContext<UnreadContextValue | undefined>(undefined)

export function UnreadProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const subscriptionRef = useRef<Subscription | null>(null)

  const incrementUnread = () => {
    setUnreadCount(prev => prev + 1)
  }

  const clearUnread = () => {
    setUnreadCount(0)
  }

  // Global ChatChannel subscription for unread tracking across all pages
  useEffect(() => {
    subscriptionRef.current = cable.subscriptions.create(
      { channel: 'ChatChannel' },
      {
        received(data: { type: string; message?: { role?: string } }) {
          if (data.type === 'message' && data.message?.role === 'assistant') {
            // Only count unread if not on the chat page or page is hidden
            const onChatPage = window.location.pathname === '/' || 
                               window.location.pathname === '/dashboard' ||
                               window.location.pathname.startsWith('/dashboard')
            if (!onChatPage || document.hidden) {
              setUnreadCount(prev => prev + 1)
            }
          }
        },
      }
    )

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [])

  return (
    <UnreadContext.Provider value={{ unreadCount, incrementUnread, clearUnread }}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnread() {
  const context = useContext(UnreadContext)
  if (context === undefined) {
    throw new Error('useUnread must be used within UnreadProvider')
  }
  return context
}
