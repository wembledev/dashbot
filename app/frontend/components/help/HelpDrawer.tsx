import { useState, useEffect, useRef } from 'react'
import { X, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useHelpDrawer } from '@/contexts/help-drawer-context'
import { cable } from '@/lib/cable'

interface HelpMessage {
  id: number
  role: string
  content: string
}

interface HelpEntry {
  topic: string
  requestId: number
  messages: HelpMessage[]
  loading: boolean
}

/** Inner component with all hooks — only rendered when context is available. */
function HelpDrawerInner({ ctx }: { ctx: ReturnType<typeof useHelpDrawer> & object }) {
  const { isOpen, topic, requestId, closeHelp, pendingMessage, clearPendingMessage } = ctx
  const [entries, setEntries] = useState<HelpEntry[]>([])
  const [collapsedEntries, setCollapsedEntries] = useState<Set<number>>(new Set())
  const subscriptionRef = useRef<ReturnType<typeof cable.subscriptions.create> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<string | null>(null)

  // Keep ref in sync with pending message state
  useEffect(() => {
    pendingRef.current = pendingMessage
  }, [pendingMessage])

  // Add new entry when a new help request arrives
  const [prevRequestId, setPrevRequestId] = useState(requestId)
  if (requestId !== prevRequestId && requestId > 0) {
    setPrevRequestId(requestId)
    // Collapse previous entries
    setCollapsedEntries(prev => {
      const next = new Set(prev)
      entries.forEach(e => next.add(e.requestId))
      return next
    })
    // Add new entry
    setEntries(prev => [...prev, { topic, requestId, messages: [], loading: true }])
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHelp()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, closeHelp])

  // Subscribe to ChatChannel when open; send pending message on connect
  useEffect(() => {
    if (!isOpen) return

    subscriptionRef.current = cable.subscriptions.create(
      { channel: 'ChatChannel' },
      {
        connected() {
          if (pendingRef.current) {
            subscriptionRef.current?.perform('send_message', { content: pendingRef.current })
            pendingRef.current = null
            clearPendingMessage()
          }
        },
        received(data: { type: string; message?: HelpMessage }) {
          if (data.type === 'message' && data.message) {
            const msg = data.message
            setEntries(prev => {
              // Add message to the latest loading entry
              const updated = [...prev]
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].loading) {
                  const existing = updated[i].messages
                  if (!existing.some(m => m.id === msg.id)) {
                    updated[i] = {
                      ...updated[i],
                      messages: [...existing, msg],
                      loading: msg.role !== 'assistant' ? updated[i].loading : false,
                    }
                  }
                  break
                }
              }
              return updated
            })
          }
        },
      }
    )

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [isOpen, requestId, clearPendingMessage])

  // Auto-scroll to bottom on new entries/messages
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [entries])

  const toggleCollapse = (id: number) => {
    setCollapsedEntries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearAll = () => {
    setEntries([])
    setCollapsedEntries(new Set())
    closeHelp()
  }

  if (!isOpen) return null

  return (
    <div
      className="w-full sm:w-[380px] bg-dashbot-bg border-l border-dashbot-border flex flex-col shrink-0"
      role="complementary"
      aria-label="Help panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-dashbot-border shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-300">Help</span>
          {entries.length > 0 && (
            <span className="text-xs text-dashbot-muted">({entries.length})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {entries.length > 1 && (
            <button
              onClick={clearAll}
              className="px-2 py-1 rounded text-[10px] text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={closeHelp}
            className="p-1.5 rounded-lg text-dashbot-muted hover:text-dashbot-text hover:bg-dashbot-surface transition-colors"
            aria-label="Close help panel"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Help entries */}
      <div ref={scrollRef} className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {entries.length === 0 && (
              <div className="text-center text-zinc-600 text-sm py-8">
                Click a <span className="text-cyan-400">?</span> button to learn more.
              </div>
            )}
            {entries.map(entry => {
              const isCollapsed = collapsedEntries.has(entry.requestId)
              const assistantMsgs = entry.messages.filter(m => m.role === 'assistant')

              return (
                <div key={entry.requestId} className="rounded-lg border border-dashbot-border overflow-hidden">
                  {/* Entry header — clickable to collapse/expand */}
                  <button
                    onClick={() => toggleCollapse(entry.requestId)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-dashbot-surface hover:bg-dashbot-surface transition-colors text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-3 text-dashbot-muted shrink-0" />
                    ) : (
                      <ChevronDown className="size-3 text-dashbot-muted shrink-0" />
                    )}
                    <span className="text-xs font-medium text-cyan-300 truncate flex-1">
                      {entry.topic}
                    </span>
                    {entry.loading && (
                      <div className="size-2 bg-cyan-400 rounded-full animate-pulse shrink-0" />
                    )}
                  </button>

                  {/* Entry content */}
                  {!isCollapsed && (
                    <div className="px-3 py-2">
                      {entry.loading && assistantMsgs.length === 0 && (
                        <div className="flex items-center gap-2 text-dashbot-muted text-xs">
                          <div className="size-1.5 bg-cyan-400 rounded-full animate-pulse" />
                          Thinking...
                        </div>
                      )}
                      {assistantMsgs.map(msg => (
                        <div key={msg.id} className="prose prose-invert prose-sm max-w-none text-dashbot-text">
                          <ReactMarkdown remarkPlugins={[remarkGfm] as never[]}>{msg.content}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

/** Persistent help panel. Renders nothing if HelpDrawerProvider is missing. */
export default function HelpDrawer() {
  const ctx = useHelpDrawer()
  if (!ctx) return null
  return <HelpDrawerInner ctx={ctx} />
}
