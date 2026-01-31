import type { ActionCard } from '@/types/cards'
import ConfirmCard from './confirm-card'

interface ActionCardProps {
  card: ActionCard
  onSelect?: (value: string) => void
}

export default function ActionCardComponent({ card, onSelect }: ActionCardProps) {
  switch (card.type) {
    case 'confirm':
      return <ConfirmCard card={card} onSelect={onSelect} />
    default:
      console.warn(`Unknown card type: ${card.type}`)
      return null
  }
}
