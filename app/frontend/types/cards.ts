export interface BaseCard {
  type: string
  id?: number
  responded?: boolean
  response?: string
  reply?: string
}

export interface ConfirmCard extends BaseCard {
  type: 'confirm'
  prompt: string
  options: Array<{
    label: string
    value: string
    style?: 'primary' | 'secondary' | 'danger'
  }>
}

export interface SelectCard extends BaseCard {
  type: 'select'
  prompt: string
  options: Array<{
    label: string
    value: string
  }>
}

export type ActionCard = ConfirmCard | SelectCard

// Helper to detect contextual help messages (sent via ?ask= param)
export function isHelpMessage(content: string): boolean {
  return content.startsWith('Explain:') || content.startsWith('💡')
}

// Extract the topic from a help message for display
export function helpMessageTopic(content: string): string {
  if (content.startsWith('💡 Help: ')) {
    const rest = content.slice('💡 Help: '.length)
    const dashIndex = rest.indexOf(' — ')
    return dashIndex > 0 ? rest.slice(0, dashIndex) : rest.slice(0, 40)
  }
  if (content.startsWith('Explain: ')) {
    const rest = content.slice('Explain: '.length)
    const dashIndex = rest.indexOf(' — ')
    return dashIndex > 0 ? rest.slice(0, dashIndex) : rest.slice(0, 40)
  }
  return 'Help'
}
