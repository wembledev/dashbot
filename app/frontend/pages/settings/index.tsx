import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import Navigation from '@/components/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sun, Moon, Trash2, MessageSquare, Brain, Bell, Cpu, ChevronDown, ChevronUp } from 'lucide-react'

function ToggleRow({ label, description, enabled, onToggle }: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-dashbot-text text-sm font-medium">{label}</p>
        <p className="text-dashbot-muted text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-dashbot-primary' : 'bg-dashbot-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

interface ModelConfig {
  alias: string
  provider: string
  model: string
  role: string
  badge?: 'primary' | 'default' | 'fast' | 'free'
}

const MODELS: ModelConfig[] = [
  { alias: 'opus', provider: 'Anthropic', model: 'Claude Opus 4.5', role: 'Complex reasoning, architecture', badge: 'primary' },
  { alias: 'sonnet', provider: 'Anthropic', model: 'Claude Sonnet 4.5', role: 'Standard coding, daily tasks', badge: 'default' },
  { alias: 'haiku', provider: 'Anthropic', model: 'Claude Haiku 4.5', role: 'Quick tasks, summaries', badge: 'fast' },
  { alias: 'gemini', provider: 'Google', model: 'Gemini 2.0 Flash', role: 'Bulk research, free tier', badge: 'free' },
]

const BADGE_STYLES: Record<string, string> = {
  primary: 'bg-dashbot-primary/20 text-dashbot-primary',
  default: 'bg-blue-500/20 text-blue-400',
  fast: 'bg-amber-500/20 text-amber-400',
  free: 'bg-green-500/20 text-green-400',
}

function ModelSettings() {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-dashbot-text">
          <Cpu className="size-4 text-violet-400" />
          Models
        </CardTitle>
        <CardDescription>AI model assignments and fallback hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Default model highlight */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-dashbot-primary/5 border border-dashbot-primary/20">
            <div>
              <p className="text-dashbot-text text-sm font-medium">Default Model</p>
              <p className="text-dashbot-muted text-xs mt-0.5">Used for main session</p>
            </div>
            <span className="text-dashbot-primary text-sm font-medium">opus</span>
          </div>

          {/* Model list */}
          <div className="space-y-1">
            {MODELS.slice(0, expanded ? MODELS.length : 2).map((m) => (
              <div key={m.alias} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-dashbot-text bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded">
                    {m.alias}
                  </code>
                  {m.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_STYLES[m.badge]}`}>
                      {m.badge === 'primary' ? 'Primary' : m.badge === 'default' ? 'Default' : m.badge === 'fast' ? 'Fast' : 'Free'}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-dashbot-text text-xs">{m.model}</p>
                  <p className="text-dashbot-muted text-[10px]">{m.role}</p>
                </div>
              </div>
            ))}
          </div>

          {MODELS.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-dashbot-muted hover:text-dashbot-text transition-colors w-full justify-center py-1"
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? 'Show less' : `Show all ${MODELS.length} models`}
            </button>
          )}

          <div className="pt-2 border-t border-dashbot-border">
            <p className="text-dashbot-muted text-[10px]">
              Model assignments managed via OpenClaw config. Use <code className="bg-[rgba(255,255,255,0.06)] px-1 rounded">/model</code> in chat to override per-session.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsIndex() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashbot-theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashbot-theme', theme)
  }, [theme])

  const clearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      router.delete('/dashboard/messages')
    }
  }

  return (
    <div className="min-h-screen bg-dashbot-bg">
      <Navigation />

      <main className="pt-14 px-2 sm:px-4 md:px-6 pb-4 sm:pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-3 sm:mb-6 mt-2 sm:mt-4">
            <h1 className="text-lg sm:text-2xl font-light text-dashbot-text tracking-wide">Settings</h1>
            <p className="text-dashbot-muted text-[11px] sm:text-sm mt-0.5 sm:mt-1">
              Dashboard preferences and configuration
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-dashbot-text">
                  {theme === 'dark' ? <Moon className="size-4 text-indigo-400" /> : <Sun className="size-4 text-amber-400" />}
                  Appearance
                </CardTitle>
                <CardDescription>Theme and display preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <ToggleRow
                  label="Light Mode"
                  description="Switch to a light color scheme"
                  enabled={theme === 'light'}
                  onToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                />
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-dashbot-text">
                  <MessageSquare className="size-4 text-blue-400" />
                  Chat
                </CardTitle>
                <CardDescription>Message and conversation settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 divide-y divide-dashbot-border">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-dashbot-text text-sm font-medium">Clear Chat History</p>
                      <p className="text-dashbot-muted text-xs mt-0.5">Delete all messages in the current session</p>
                    </div>
                    <button
                      onClick={clearChat}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="size-3.5 inline mr-1" />
                      Clear
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Models */}
            <ModelSettings />

            {/* Memory (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-dashbot-text">
                  <Brain className="size-4 text-cyan-400" />
                  Memory
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dashbot-primary/20 text-dashbot-primary font-medium">Soon</span>
                </CardTitle>
                <CardDescription>Auto-save frequency, summaries, compression</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-dashbot-muted text-xs">Configure how often memories are saved, summarized, and compressed.</p>
              </CardContent>
            </Card>

            {/* Notifications (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-dashbot-text">
                  <Bell className="size-4 text-yellow-400" />
                  Notifications
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dashbot-primary/20 text-dashbot-primary font-medium">Soon</span>
                </CardTitle>
                <CardDescription>Telegram pings, card alerts, digest frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-dashbot-muted text-xs">Control when and how the agent notifies you about new items.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
