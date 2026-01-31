import { useState, useEffect, useRef, useCallback } from 'react'
import { createConsumer } from '@rails/actioncable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'
import Navigation from '@/components/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useUnread } from '@/contexts/unread-context'
import ActionCard from '@/components/chat/action-card'
import type { ActionCard as ActionCardType } from '@/types/cards'

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
    <div className="relative h-screen bg-dashbot-bg overflow-hidden">
      <Navigation connected={connected} />

      {/* Messages — scrollable middle */}
      <div ref={scrollAreaRef}>
        <ScrollArea className="h-screen px-4 pt-20 pb-20">
        <div className="max-w-3xl mx-auto py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-dashbot-muted py-12">
              No messages yet. Say something!
            </div>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${msg.role === 'assistant' && msg.metadata?.card ? 'w-full max-w-md' : ''}`}
              >
                <div
                  className={`rounded-2xl px-5 py-3.5 text-lg ${
                    msg.role === 'user'
                      ? 'bg-dashbot-primary text-white shadow-[0_0_20px_rgba(62,106,225,0.3)] whitespace-pre-wrap'
                      : 'bg-[rgba(255,255,255,0.1)] text-dashbot-text prose prose-invert prose-sm max-w-none'
                  }`}
                >
                  {msg.role === 'user' ? msg.content : (
                    <ReactMarkdown remarkPlugins={[remarkGfm] as never[]}>{msg.content}</ReactMarkdown>
                  )}
                </div>
                {msg.role === 'assistant' && Boolean(msg.metadata?.card) && (
                  <ActionCard 
                    card={msg.metadata!.card as ActionCardType} 
                    onSelect={handleCardSelect}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      </div>

      {/* Input — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-dashbot-bg/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-14 rounded-full bg-dashbot-surface border-dashbot-border text-dashbot-text text-lg font-light"
            autoFocus
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || !connected} size="icon" className="shadow-[0_0_20px_rgba(62,106,225,0.3)]">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
