import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { ConfirmCard } from '@/types/cards'

interface ConfirmCardProps {
  card: ConfirmCard
  onSelect?: (value: string) => void
}

export default function ConfirmCardComponent({ card, onSelect }: ConfirmCardProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(
    card.responded ? (card.response || null) : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reply] = useState<string | null>(card.reply || null)

  const handleSelect = async (value: string) => {
    if (selectedValue || loading) return
    setError(null)

    if (card.id) {
      setLoading(true)
      try {
        const res = await fetch(`/api/cards/${card.id}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ value }),
        })

        if (res.ok) {
          setSelectedValue(value)
        } else if (res.status === 409) {
          const data = await res.json()
          setSelectedValue(data.card?.response || value)
        } else {
          setError('Failed — try again')
          console.error('Card respond failed:', await res.text())
        }
      } catch (err) {
        setError('Network error — try again')
        console.error('Card respond error:', err)
      } finally {
        setLoading(false)
      }
    } else {
      setSelectedValue(value)
      onSelect?.(value)
    }
  }

  const selectedLabel = card.options.find(o => o.value === selectedValue)?.label
  const isResponded = selectedValue !== null

  // After responding: clean result view (no buttons)
  if (isResponded) {
    return (
      <div className="mt-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-dashbot-border overflow-hidden">
        <div className="p-4">
          <p className="text-dashbot-muted text-sm">{card.prompt}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-dashbot-primary/20">
              <Check className="size-3.5 text-dashbot-primary" />
            </div>
            <span className="text-dashbot-text text-base font-medium">{selectedLabel}</span>
          </div>
          {reply && (
            <p className="text-dashbot-muted text-sm mt-3 pl-8 border-l-2 border-dashbot-primary/30">{reply}</p>
          )}
        </div>
      </div>
    )
  }

  // Pending: show buttons
  return (
    <div className="mt-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-dashbot-border overflow-hidden">
      <div className="p-4 space-y-3">
        <p className="text-dashbot-text text-base font-medium">{card.prompt}</p>
        <div className="flex gap-2">
          {card.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={loading}
              className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                ${option.style === 'danger'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : option.style === 'primary'
                    ? 'bg-dashbot-primary/10 text-dashbot-primary border border-dashbot-primary/30 hover:bg-dashbot-primary/20'
                    : 'bg-dashbot-surface text-dashbot-text border border-dashbot-border hover:bg-[rgba(255,255,255,0.1)]'
                }`}
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {option.label}
            </button>
          ))}
        </div>
        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
