import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import Navigation from '@/components/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sun, Moon, Trash2, MessageSquare, Brain, Bell, Cpu, ChevronDown, ChevronUp, HelpCircle, Save, RefreshCw } from 'lucide-react'

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

function HelpButton({ helpText, section }: { helpText: string; section: string }) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="ml-2 text-dashbot-muted hover:text-dashbot-text transition-colors"
        title="Help"
      >
        <HelpCircle className="size-3.5" />
      </button>
      {showHelp && (
        <div className="mt-2 p-3 rounded-lg bg-dashbot-primary/5 border border-dashbot-primary/20">
          <p className="text-dashbot-text text-xs">{helpText}</p>
        </div>
      )}
    </>
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
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashbot-default-model') || 'opus'
    }
    return 'opus'
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleModelChange = async (modelAlias: string) => {
    setSelectedModel(modelAlias)
    localStorage.setItem('dashbot-default-model', modelAlias)

    setSaving(true)
    setSaveStatus('idle')

    try {
      const token = localStorage.getItem('dashbot-api-token') || ''
      const response = await fetch('/api/settings/model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ model: modelAlias }),
      })

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Failed to save model selection:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-dashbot-text">
          <Cpu className="size-4 text-violet-400" />
          Models
          <HelpButton 
            section="models"
            helpText="Choose which AI model handles your conversations. Opus is smartest but most expensive. Haiku is fastest and cheapest."
          />
        </CardTitle>
        <CardDescription>AI model assignments and fallback hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Model selector */}
          <div className="space-y-2">
            <p className="text-dashbot-text text-sm font-medium mb-2">Default Model</p>
            {MODELS.map((m) => (
              <label
                key={m.alias}
                className={`flex items-center justify-between py-3 px-3 rounded-lg cursor-pointer transition-colors ${
                  selectedModel === m.alias
                    ? 'bg-dashbot-primary/10 border border-dashbot-primary/30'
                    : 'bg-dashbot-card border border-dashbot-border hover:border-dashbot-primary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="model"
                    value={m.alias}
                    checked={selectedModel === m.alias}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-4 h-4 text-dashbot-primary focus:ring-dashbot-primary"
                  />
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
                </div>
                <div className="text-right">
                  <p className="text-dashbot-text text-xs">{m.model}</p>
                  <p className="text-dashbot-muted text-[10px]">{m.role}</p>
                </div>
              </label>
            ))}
          </div>

          {saveStatus === 'success' && (
            <p className="text-green-400 text-xs">✓ Model preference saved</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-red-400 text-xs">✗ Failed to save model preference</p>
          )}

          <div className="pt-2 border-t border-dashbot-border">
            <p className="text-dashbot-muted text-[10px]">
              Use <code className="bg-[rgba(255,255,255,0.06)] px-1 rounded">/model</code> in chat to override per-session.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MemorySettings() {
  const [memoryNote, setMemoryNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [reindexStatus, setReindexStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Get qmd stats from localStorage (set by status poll)
  const [qmdStats, setQmdStats] = useState<{ files?: number; vectors?: number; indexSize?: string }>({})

  useEffect(() => {
    // Try to get stats from localStorage
    const statusData = localStorage.getItem('openclaw-status')
    if (statusData) {
      try {
        const data = JSON.parse(statusData)
        if (data.qmd) {
          setQmdStats({
            files: data.qmd.files,
            vectors: data.qmd.vectors,
            indexSize: data.qmd.indexSize,
          })
        }
      } catch (e) {
        console.error('Failed to parse status data:', e)
      }
    }
  }, [])

  const handleSaveMemory = async () => {
    if (!memoryNote.trim()) return

    setSaving(true)
    setSaveStatus('idle')

    try {
      const token = localStorage.getItem('dashbot-api-token') || ''
      const response = await fetch('/api/memory/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: memoryNote }),
      })

      if (response.ok) {
        setSaveStatus('success')
        setMemoryNote('')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Failed to save memory:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    setReindexStatus('idle')

    try {
      const token = localStorage.getItem('dashbot-api-token') || ''
      const response = await fetch('/api/memory/reindex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setReindexStatus('success')
        setTimeout(() => setReindexStatus('idle'), 3000)
      } else {
        setReindexStatus('error')
        setTimeout(() => setReindexStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Failed to reindex:', error)
      setReindexStatus('error')
      setTimeout(() => setReindexStatus('idle'), 3000)
    } finally {
      setReindexing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-dashbot-text">
          <Brain className="size-4 text-cyan-400" />
          Memory
          <HelpButton 
            section="memory"
            helpText="Manage the agent's memory system. Files are indexed and embedded as vectors for semantic search."
          />
        </CardTitle>
        <CardDescription>Vector search index and memory management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* QMD Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-dashbot-card border border-dashbot-border">
              <p className="text-dashbot-muted text-[10px] uppercase tracking-wide mb-1">Files</p>
              <p className="text-dashbot-text text-lg font-semibold">{qmdStats.files || '—'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-dashbot-card border border-dashbot-border">
              <p className="text-dashbot-muted text-[10px] uppercase tracking-wide mb-1">Vectors</p>
              <p className="text-dashbot-text text-lg font-semibold">{qmdStats.vectors || '—'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-dashbot-card border border-dashbot-border">
              <p className="text-dashbot-muted text-[10px] uppercase tracking-wide mb-1">Index Size</p>
              <p className="text-dashbot-text text-lg font-semibold">{qmdStats.indexSize || '—'}</p>
            </div>
          </div>

          {/* Save Memory Note */}
          <div className="space-y-2">
            <label className="text-dashbot-text text-sm font-medium">Save Memory Note</label>
            <textarea
              value={memoryNote}
              onChange={(e) => setMemoryNote(e.target.value)}
              placeholder="Type a note to save to memory..."
              className="w-full min-h-[96px] px-3 py-2 rounded-lg bg-dashbot-card border border-dashbot-border text-dashbot-text text-sm placeholder:text-dashbot-muted focus:outline-none focus:ring-2 focus:ring-dashbot-primary/50"
            />
            <button
              onClick={handleSaveMemory}
              disabled={saving || !memoryNote.trim()}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-dashbot-primary text-white font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              <Save className="size-4" />
              {saving ? 'Saving...' : 'Save Memory'}
            </button>
            {saveStatus === 'success' && (
              <p className="text-green-400 text-xs">✓ Memory saved to dashbot-notes.md</p>
            )}
            {saveStatus === 'error' && (
              <p className="text-red-400 text-xs">✗ Failed to save memory</p>
            )}
          </div>

          {/* Re-index Button */}
          <div className="pt-2 border-t border-dashbot-border">
            <button
              onClick={handleReindex}
              disabled={reindexing}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-lg border border-dashbot-primary/30 text-dashbot-primary font-medium transition-colors hover:bg-dashbot-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`size-4 ${reindexing ? 'animate-spin' : ''}`} />
              {reindexing ? 'Re-indexing...' : 'Re-index Memory'}
            </button>
            {reindexStatus === 'success' && (
              <p className="text-green-400 text-xs mt-2">✓ Re-indexing started in background</p>
            )}
            {reindexStatus === 'error' && (
              <p className="text-red-400 text-xs mt-2">✗ Failed to start re-indexing</p>
            )}
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
                  <HelpButton 
                    section="appearance"
                    helpText="Toggle between dark and light themes"
                  />
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
                  <HelpButton 
                    section="chat"
                    helpText="Manage chat history and message display"
                  />
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

            {/* Memory */}
            <MemorySettings />

            {/* Notifications (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-dashbot-text">
                  <Bell className="size-4 text-yellow-400" />
                  Notifications
                  <HelpButton 
                    section="notifications"
                    helpText="Control how and when you receive alerts"
                  />
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
