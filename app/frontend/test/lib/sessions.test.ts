import { parseSessionType, parseSession, friendlySessionLabel } from '@/lib/sessions'
import type { SessionInfo } from '@/types/status'

function session(overrides: Partial<SessionInfo>): SessionInfo {
  return {
    key: 'agent:main:main',
    kind: 'direct',
    model: 'anthropic/claude-opus-4-6',
    tokens: '10k/200k',
    context_percent: 5,
    age: '5m ago',
    flags: '',
    ...overrides,
  }
}

describe('sessions parsing', () => {
  it('classifies provider-prefixed channel keys', () => {
    const s = session({ key: 'agent:main:discord:channel:1470090683992903841', kind: 'group', chat_type: 'channel' })
    expect(parseSessionType(s)).toBe('channel')
  })

  it('classifies dashbot keys', () => {
    const s = session({ key: 'agent:main:dashbot:default', kind: 'direct' })
    expect(parseSessionType(s)).toBe('dashbot')
    expect(friendlySessionLabel(s)).toBe('DashBot')
  })

  it('produces readable labels for parsed channel sessions', () => {
    const s = session({ key: 'agent:main:discord:channel:1470090683992903841', kind: 'group', chat_type: 'channel' })
    const parsed = parseSession(s)
    expect(parsed.type).toBe('channel')
    expect(parsed.label).toMatch(/^Channel:/)
    expect(parsed.label).toContain('Discord')
  })
})
