import { HelpCircle } from 'lucide-react'
import { router } from '@inertiajs/react'

interface Props {
  topic: string
  description: string
}

export default function HelpButton({ topic, description }: Props) {
  const askForHelp = () => {
    // Navigate to chat with the question as a query param
    // The chat page will detect it and send it as a message
    const message = `Explain: ${topic} — ${description}`
    router.visit(`/dashboard?ask=${encodeURIComponent(message)}`)
  }

  return (
    <button
      onClick={askForHelp}
      className="p-0.5 rounded-full text-dashbot-muted hover:text-dashbot-text transition-colors opacity-50 hover:opacity-100"
      aria-label={`Help: ${topic}`}
      title={`Ask about ${topic}`}
    >
      <HelpCircle className="size-3.5" />
    </button>
  )
}
