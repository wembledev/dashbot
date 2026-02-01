import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface HelpDrawerContextValue {
  isOpen: boolean
  topic: string
  requestId: number
  pendingMessage: string | null
  openHelp: (topic: string, context: string) => void
  closeHelp: () => void
  clearPendingMessage: () => void
}

const HelpDrawerContext = createContext<HelpDrawerContextValue | undefined>(undefined)

export function HelpDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [requestId, setRequestId] = useState(0)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const openHelp = useCallback((newTopic: string, context: string) => {
    setTopic(newTopic)
    setPendingMessage(`💡 Help: ${newTopic} — ${context} Give a concise, helpful explanation.`)
    setIsOpen(true)
    setRequestId(prev => prev + 1)
  }, [])

  const closeHelp = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null)
  }, [])

  return (
    <HelpDrawerContext.Provider value={{ isOpen, topic, requestId, pendingMessage, openHelp, closeHelp, clearPendingMessage }}>
      {children}
    </HelpDrawerContext.Provider>
  )
}

/**
 * Access the help drawer context.
 * Returns undefined when used outside HelpDrawerProvider (safe for isolated tests).
 */
export function useHelpDrawer(): HelpDrawerContextValue | undefined {
  return useContext(HelpDrawerContext)
}
