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
