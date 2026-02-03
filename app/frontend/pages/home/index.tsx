import { useState, useEffect, useRef, useCallback } from 'react'
import { createConsumer } from '@rails/actioncable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useUnread } from '@/contexts/unread-context'
import ActionCard from '@/components/chat/action-card'
import type { ActionCard as ActionCardType } from '@/types/cards'
import { isHelpMessage, helpMessageTopic } from '@/types/cards'
import { Lightbulb, Car } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import { useCarMode } from '@/contexts/car-mode-context'

interface Message {
  id: number
  role: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface Props {
  chat_session_id: number
  messages: Message[]
}

export default function HomeIndex({ chat_session_id, messages: initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const subscriptionRef = useRef<ReturnType<ReturnType<typeof createConsumer>['subscriptions']['create']> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { clearUnread } = useUnread()
  const { carMode, toggleCarMode } = useCarMode()

  const scrollToBottom = useCallback((smooth = true) => {
    // Scroll the Radix viewport directly (scrollIntoView doesn't work reliably with custom scroll containers)
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    if (viewport) {
      if (smooth && typeof viewport.scrollTo === 'function') {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
      } else {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [])

  // Clear unread count when page loads
  useEffect(() => {
    clearUnread()
  }, [clearUnread])

  // Handle ?ask= query param (from help buttons, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const askMessage = params.get('ask')
    if (askMessage && subscriptionRef.current) {
      subscriptionRef.current.perform('send_message', { content: askMessage })
      // Clean up URL without triggering navigation
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [connected]) // Re-run when connection establishes

  // Initial scroll to bottom (instant)
  useEffect(() => {
    scrollToBottom(false)
  }, [scrollToBottom])

  // Track scroll position to detect if user is at bottom
  useEffect(() => {
    // Find the Radix ScrollArea viewport element
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]')
    if (!viewport) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport
      const atBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsAtBottom(atBottom)
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll on new messages only if at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(true)
    }
  }, [messages, isAtBottom, scrollToBottom])

  useEffect(() => {
    const consumer = createConsumer()
    const subscription = consumer.subscriptions.create(
      { channel: 'ChatChannel', session_id: chat_session_id },
      {
        connected() {
          setConnected(true)
        },
        disconnected() {
          setConnected(false)
        },
        received(data: { type: string; message?: Message; card_id?: number; message_id?: number; response?: string; reply?: string }) {
          if (data.type === 'message') {
            setMessages(prev => {
              if (prev.some(m => m.id === data.message!.id)) return prev
              return [...prev, data.message!]
            })
          } else if (data.type === 'card_responded') {
            // Update card state in the message that contains it
            setMessages(prev => prev.map(m => {
              if (m.id === data.message_id && m.metadata?.card) {
                return {
                  ...m,
                  metadata: {
                    ...m.metadata,
                    card: {
                      ...(m.metadata.card as Record<string, unknown>),
                      responded: true,
                      response: data.response,
                      reply: data.reply,
                    }
                  }
                }
              }
              return m
            }))
          } else if (data.type === 'clear') {
            setMessages([])
          }
        },
      }
    )
    subscriptionRef.current = subscription

    return () => {
      subscription.unsubscribe()
      consumer.disconnect()
    }
  }, [chat_session_id])

  const sendMessage = useCallback((content?: string) => {
    const text = content || input.trim()
    if (!text || !subscriptionRef.current) return

    subscriptionRef.current.perform('send_message', { content: text })
    if (!content) {
      setInput('')
      inputRef.current?.blur()
    }
  }, [input])

  const handleCardSelect = useCallback((value: string) => {
    sendMessage(value)
  }, [sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="relative h-full bg-zinc-950 overflow-hidden flex flex-col">
      {/* Chat header with help */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/30 shrink-0">
        <span className="text-xs car:text-sm text-zinc-500">{messages.length} messages</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleCarMode}
            className={`p-1 rounded transition-colors ${carMode ? 'text-blue-400 bg-blue-400/15' : 'text-zinc-500 hover:text-zinc-300'}`}
            title={carMode ? 'Disable car mode' : 'Enable car mode'}
          >
            <Car className="size-3.5 car:size-5" />
          </button>
          <HelpButton
            topic="Chat"
            context={`DashBot chat interface. Currently ${messages.length} messages in this session. Chat connects via WebSocket to the AI agent for real-time conversation. You can ask questions, give commands, and the agent will respond. What can I do here? How does the chat work?`}
          />
        </div>
      </div>
      {/* Messages — scrollable */}
      <div ref={scrollAreaRef} className="flex-1 min-h-0">
        <ScrollArea className="h-full px-3">
        <div className="max-w-3xl mx-auto py-2 space-y-1.5 car:space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 py-8 text-sm car:text-lg">
              No messages yet. Say something!
            </div>
          )}
          {messages.map((msg, idx) => {
            // Detect help responses: assistant message right after a user "Explain:" message
            const prevMsg = idx > 0 ? messages[idx - 1] : null
            const isHelpResponse = msg.role === 'assistant' && prevMsg?.role === 'user' && isHelpMessage(prevMsg.content)
            // Also detect if this user message is a help request (style it subtly)
            const isHelpRequest = msg.role === 'user' && isHelpMessage(msg.content)

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${msg.role === 'assistant' && msg.metadata?.card ? 'w-full max-w-md' : ''}`}
                >
                  {isHelpResponse ? (
                    /* Help card — distinct styling with contextual title */
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-cyan-500/20 bg-cyan-500/10">
                        <Lightbulb className="size-3 text-cyan-400" />
                        <span className="text-xs font-medium text-cyan-300">
                          About {prevMsg ? helpMessageTopic(prevMsg.content) : 'Help'}
                        </span>
                      </div>
                      <div className="px-3 py-2 car:px-4 car:py-3 text-sm car:text-lg text-dashbot-text prose prose-invert prose-sm car:prose-lg max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm] as never[]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-lg px-3 py-2 car:px-4 car:py-3 text-sm car:text-lg ${
                        msg.role === 'user'
                          ? isHelpRequest
                            ? 'bg-cyan-500/15 text-cyan-100 border border-cyan-500/20 whitespace-pre-wrap text-xs car:text-sm'
                            : 'bg-dashbot-primary text-white shadow-[0_0_12px_rgba(62,106,225,0.25)] whitespace-pre-wrap'
                          : 'bg-[rgba(255,255,255,0.07)] text-dashbot-text prose prose-invert prose-sm car:prose-lg max-w-none'
                      }`}
                    >
                      {msg.role === 'user' ? msg.content : (
                        <ReactMarkdown remarkPlugins={[remarkGfm] as never[]}>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  )}
                  {msg.role === 'assistant' && Boolean(msg.metadata?.card) && (
                    <ActionCard 
                      card={msg.metadata!.card as ActionCardType} 
                      onSelect={handleCardSelect}
                    />
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      </div>

      {/* Input — bottom of content area */}
      <div className="shrink-0 px-3 py-2 car:px-4 car:py-3 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/50 mb-safe">
        <div className="max-w-3xl mx-auto flex gap-1.5 car:gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-8 car:h-12 rounded-full bg-dashbot-surface border-dashbot-border text-dashbot-text text-sm car:text-lg font-light"
            autoFocus
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || !connected} size="icon" className="shadow-[0_0_12px_rgba(62,106,225,0.25)] car:size-12">
            <Send className="size-3.5 car:size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
