import { createConsumer } from '@rails/actioncable'

// Create a singleton consumer
const getCableUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/cable`
}

export const cable = createConsumer(getCableUrl())
