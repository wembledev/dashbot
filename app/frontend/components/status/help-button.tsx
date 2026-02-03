import { HelpCircle } from 'lucide-react'
import { router } from '@inertiajs/react'
import { useHelpDrawer } from '@/contexts/help-drawer-context'

interface Props {
  topic: string
  /** @deprecated Use `context` instead */
  description?: string
  /** Rich context string sent to backend for better help responses */
  context?: string
}

export default function HelpButton({ topic, description, context }: Props) {
  const helpDrawer = useHelpDrawer()

  const askForHelp = () => {
    const richContext = context || description || ''

    if (helpDrawer) {
      // Open the slide-in help drawer (user stays on current page)
      helpDrawer.openHelp(topic, richContext)
    } else {
      // Fallback: navigate to chat page
      const message = `💡 Help: ${topic} — ${richContext} Give a concise, helpful explanation.`
      router.visit(`/dashboard?ask=${encodeURIComponent(message)}`)
    }
  }

  return (
    <button
      onClick={askForHelp}
      className="p-1 rounded-lg text-dashbot-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
      aria-label={`Help: ${topic}`}
      title={`Ask about ${topic}`}
    >
      <HelpCircle className="size-3.5" />
    </button>
  )
}
