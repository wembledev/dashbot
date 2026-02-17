import { useState, useEffect, useMemo, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sun, Moon, Monitor, Trash2, MessageSquare, Brain, Bell, BellRing, Cpu, LogOut, RefreshCw, Save, Plus } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import { useCarMode } from '@/contexts/car-mode-context'

type ThemePreference = 'system' | 'dark' | 'light'

type SaveState = {
  type: 'idle' | 'ok' | 'error'
  message: string
}

type AgentModelRow = {
  id: string
  model: string
}

type CronModelRow = {
  id: string
  name: string
  enabled: boolean
  model: string
}

type ModelConfigPayload = {
  primary: string
  fallbacks: string[]
  subagentModel: string
  embeddingModel: string
  memoryFallback: string
  agents: AgentModelRow[]
  cronModels: CronModelRow[]
  availableModels: string[]
  enabledModels?: string[]
}

const FALLBACK_MODEL_OPTIONS = [
  'openai-codex/gpt-5.3-codex',
  'anthropic/claude-opus-4-6',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-4-5',
]

function resolveTheme(pref: ThemePreference): 'dark' | 'light' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref
}

function applyTheme(resolved: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', resolved)
}

function ToggleRow({ label, description, enabled, onToggle }: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-dashbot-text text-sm font-medium">{label}</p>
        <p className="text-dashbot-muted text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-dashbot-surface'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

async function postJson(url: string, body: Record<string, unknown>) {
  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Accept': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })

  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {
    // ignore parse failures
  }

  if (!res.ok) {
    throw new Error((data.error as string) || 'Request failed')
  }

  return data
}

async function getJson(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data.error as string) || 'Request failed')
  }
  return data as Record<string, unknown>
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

export default function SettingsIndex() {
  const [themePref, setThemePref] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashbot-theme') as ThemePreference) || 'system'
    }
    return 'system'
  })

  const [modelPrimary, setModelPrimary] = useState<string>('')
  const [modelFallbacks, setModelFallbacks] = useState<string[]>([])
  const [subagentModel, setSubagentModel] = useState<string>('')
  const [embeddingModel, setEmbeddingModel] = useState<string>('')
  const [memoryFallback, setMemoryFallback] = useState<string>('')
  const [agentModels, setAgentModels] = useState<AgentModelRow[]>([])
  const [cronModels, setCronModels] = useState<CronModelRow[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODEL_OPTIONS)
  const [enabledModels, setEnabledModels] = useState<string[]>([])

  const [restartGatewayOnModelChange, setRestartGatewayOnModelChange] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashbot-model-restart') !== 'false'
    }
    return true
  })
  const [ensurePhoneAccessAfterRestart, setEnsurePhoneAccessAfterRestart] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashbot-model-ensure-phone') !== 'false'
    }
    return true
  })
  const [modelLoading, setModelLoading] = useState(true)
  const [modelSaving, setModelSaving] = useState(false)

  const [memoryNote, setMemoryNote] = useState('')
  const [memorySaving, setMemorySaving] = useState(false)
  const [memoryReindexing, setMemoryReindexing] = useState(false)

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dashbot-notify-enabled') !== 'false'
    return true
  })
  const [desktopNotifications, setDesktopNotifications] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dashbot-notify-desktop') !== 'false'
    return true
  })
  const [soundNotifications, setSoundNotifications] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dashbot-notify-sound') !== 'false'
    return true
  })

  const [saveState, setSaveState] = useState<SaveState>({ type: 'idle', message: '' })

  const { carMode, toggleCarMode } = useCarMode()

  const resolvedTheme = useMemo(() => {
    if (typeof window === 'undefined') return 'dark'
    return resolveTheme(themePref)
  }, [themePref])

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    localStorage.setItem('dashbot-theme', themePref)
  }, [themePref])

  useEffect(() => {
    localStorage.setItem('dashbot-model-restart', restartGatewayOnModelChange ? 'true' : 'false')
  }, [restartGatewayOnModelChange])

  useEffect(() => {
    localStorage.setItem('dashbot-model-ensure-phone', ensurePhoneAccessAfterRestart ? 'true' : 'false')
  }, [ensurePhoneAccessAfterRestart])

  useEffect(() => {
    localStorage.setItem('dashbot-notify-enabled', notificationsEnabled ? 'true' : 'false')
  }, [notificationsEnabled])

  useEffect(() => {
    localStorage.setItem('dashbot-notify-desktop', desktopNotifications ? 'true' : 'false')
  }, [desktopNotifications])

  useEffect(() => {
    localStorage.setItem('dashbot-notify-sound', soundNotifications ? 'true' : 'false')
  }, [soundNotifications])

  useEffect(() => {
    if (themePref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      setThemePref('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themePref])

  const clearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      router.delete('/dashboard/messages')
    }
  }

  const setOk = (message: string) => setSaveState({ type: 'ok', message })
  const setError = (message: string) => setSaveState({ type: 'error', message })

  const loadModelConfig = useCallback(async () => {
    setModelLoading(true)
    try {
      const data = await getJson('/api/settings/model-config')
      const config = data.config as ModelConfigPayload | undefined
      if (!config) throw new Error('Model config response missing data')

      const configuredEnabledModels = uniqueNonEmpty(config.enabledModels || [])
      const configuredAvailableModels = uniqueNonEmpty(config.availableModels || [])
      const baseModels = configuredEnabledModels.length > 0 ? configuredEnabledModels : configuredAvailableModels
      const mergedModels = uniqueNonEmpty([...baseModels, ...configuredAvailableModels, ...FALLBACK_MODEL_OPTIONS])

      setEnabledModels(configuredEnabledModels)
      setAvailableModels(mergedModels)

      setModelPrimary(config.primary || mergedModels[0] || FALLBACK_MODEL_OPTIONS[0])
      setModelFallbacks(config.fallbacks || [])
      setSubagentModel(config.subagentModel || config.primary || mergedModels[0] || FALLBACK_MODEL_OPTIONS[0])
      setEmbeddingModel(config.embeddingModel || '')
      setMemoryFallback(config.memoryFallback || '')
      setAgentModels(config.agents || [])
      setCronModels(config.cronModels || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model config')
    } finally {
      setModelLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadModelConfig()
  }, [loadModelConfig])

  const modelOptions = useMemo(() => {
    const preferred = enabledModels.length > 0 ? enabledModels : availableModels
    const inUse = [
      modelPrimary,
      subagentModel,
      embeddingModel,
      ...modelFallbacks,
      ...agentModels.map((agent) => agent.model),
      ...cronModels.map((job) => job.model),
    ]

    return uniqueNonEmpty([...preferred, ...availableModels, ...inUse, ...FALLBACK_MODEL_OPTIONS])
  }, [
    enabledModels,
    availableModels,
    modelPrimary,
    subagentModel,
    embeddingModel,
    modelFallbacks,
    agentModels,
    cronModels,
  ])

  const defaultModelChoice = modelOptions[0] || ''

  const addFallbackModel = () => {
    const firstUnused = modelOptions.find((model) => !modelFallbacks.includes(model))
    const nextModel = firstUnused || defaultModelChoice
    if (!nextModel) return
    setModelFallbacks((prev) => [...prev, nextModel])
  }

  const updateFallbackModel = (index: number, value: string) => {
    setModelFallbacks((prev) => prev.map((model, i) => (i === index ? value : model)))
  }

  const removeFallbackModel = (index: number) => {
    setModelFallbacks((prev) => prev.filter((_, i) => i !== index))
  }

  const updateAgentModel = (id: string, model: string) => {
    setAgentModels((prev) => prev.map((agent) => (agent.id === id ? { ...agent, model } : agent)))
  }

  const updateCronModel = (id: string, model: string) => {
    setCronModels((prev) => prev.map((job) => (job.id === id ? { ...job, model } : job)))
  }

  const saveModelConfig = async () => {
    if (!modelPrimary.trim()) {
      setError('Primary model cannot be empty.')
      return
    }

    if (!subagentModel.trim()) {
      setError('Sub-agent model cannot be empty.')
      return
    }

    setModelSaving(true)
    try {
      const payload = {
        primary: modelPrimary.trim(),
        fallbacks: uniqueNonEmpty(modelFallbacks),
        subagentModel: subagentModel.trim(),
        embeddingModel: embeddingModel.trim(),
        memoryFallback: memoryFallback.trim(),
        agents: agentModels.map((agent) => ({ id: agent.id, model: agent.model.trim() })),
        cronModels: cronModels.map((job) => ({ id: job.id, model: job.model.trim() })),
        restart: restartGatewayOnModelChange,
        ensurePhoneAccess: ensurePhoneAccessAfterRestart,
      }

      const result = await postJson('/api/settings/model-config', payload)

      const restarted = Boolean(result.restarted)
      const phoneAccess = result.phoneAccess as { ok?: boolean; target?: string } | undefined

      let message = restarted
        ? 'Model settings saved. Gateway restarted.'
        : 'Model settings saved.'

      if (restarted && ensurePhoneAccessAfterRestart) {
        if (phoneAccess?.ok) {
          message += ` Phone access re-bound to ${phoneAccess.target || 'DashBot'}.`
        } else {
          message += ' Gateway restarted, but phone access check did not confirm re-bind.'
        }
      }

      setOk(message)
      await loadModelConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update model settings')
    } finally {
      setModelSaving(false)
    }
  }

  const saveMemoryNote = async () => {
    if (!memoryNote.trim()) {
      setError('Write a memory note first.')
      return
    }
    setMemorySaving(true)
    try {
      await postJson('/api/memory/save', { note: memoryNote })
      setMemoryNote('')
      setOk('Memory note saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory note')
    } finally {
      setMemorySaving(false)
    }
  }

  const reindexMemory = async () => {
    setMemoryReindexing(true)
    try {
      const result = await postJson('/api/memory/reindex', {})
      const mode = (result.mode as string) || 'default'
      setOk(`Memory reindex started (${mode}).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reindex memory')
    } finally {
      setMemoryReindexing(false)
    }
  }

  const testNotification = async () => {
    if (!notificationsEnabled) {
      setError('Enable notifications first.')
      return
    }

    try {
      if (desktopNotifications && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission()
        }
        if (Notification.permission === 'granted') {
          new Notification('DashBot test', {
            body: 'Notifications are enabled and working.',
            icon: '/icon.png',
          })
        }
      }

      if (soundNotifications) {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.value = 0.05
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      }

      setOk('Notification test sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notification test failed')
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-dashbot-bg">
      <div className="px-2 sm:px-3 pb-3">
        <div>
          <div className="mb-2 mt-2 flex items-center justify-between">
            <h1 className="text-sm sm:text-base font-medium text-dashbot-text">Settings</h1>
            <HelpButton
              topic="Settings"
              context="DashBot Settings page. Configure appearance, model defaults, memory actions, notifications, and session controls."
            />
          </div>

          {saveState.type !== 'idle' && (
            <div className={`mb-2 rounded border px-2.5 py-2 text-xs ${
              saveState.type === 'ok'
                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}>
              {saveState.message}
            </div>
          )}

          <div className="space-y-2">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  {resolvedTheme === 'dark' ? <Moon className="size-3.5 text-indigo-400" /> : <Sun className="size-3.5 text-amber-400" />}
                  Appearance
                </CardTitle>
                <CardDescription>Theme and display preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 divide-y divide-dashbot-border">
                  <div className="py-2">
                    <p className="text-dashbot-text text-sm font-medium mb-2">Theme</p>
                    <div className="flex rounded-lg border border-dashbot-border overflow-hidden">
                      {themeOptions.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setThemePref(value)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                            themePref === value
                              ? 'bg-dashbot-primary text-white'
                              : 'bg-dashbot-surface text-dashbot-muted hover:text-dashbot-text'
                          }`}
                        >
                          <Icon className="size-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ToggleRow
                    label="Car Mode"
                    description="Larger text and buttons for driving (Tesla browser)"
                    enabled={carMode}
                    onToggle={toggleCarMode}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Models */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <Cpu className="size-3.5 text-violet-400" />
                  Models
                </CardTitle>
                <CardDescription>Edit primary/fallback models, agent assignments, cron models, and restart behavior</CardDescription>
              </CardHeader>
              <CardContent>
                {modelLoading ? (
                  <p className="text-sm text-dashbot-muted">Loading model configuration…</p>
                ) : (
                  <div className="space-y-4">
                    {enabledModels.length > 0 ? (
                      <p className="text-[11px] text-dashbot-muted">
                        Showing enabled OpenClaw models ({enabledModels.length})
                      </p>
                    ) : (
                      <p className="text-[11px] text-yellow-300/80">
                        Enabled model registry was empty — showing known/in-use models.
                      </p>
                    )}

                    <div>
                      <label className="text-dashbot-text text-sm font-medium block mb-1.5">Primary default model</label>
                      <select
                        value={modelPrimary}
                        onChange={(e) => setModelPrimary(e.target.value)}
                        className="w-full rounded-lg bg-dashbot-surface border border-dashbot-border px-2.5 py-2 text-sm text-dashbot-text"
                      >
                        {modelOptions.length === 0 ? (
                          <option value="">No models available</option>
                        ) : (
                          modelOptions.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-dashbot-text text-sm font-medium">Fallback chain (in order)</label>
                        <button
                          type="button"
                          onClick={addFallbackModel}
                          disabled={modelOptions.length === 0}
                          className="px-2 py-1 rounded text-xs font-medium text-dashbot-text border border-dashbot-border hover:bg-dashbot-surface disabled:opacity-40"
                        >
                          <Plus className="size-3 inline mr-0.5" /> Add fallback
                        </button>
                      </div>

                      {modelFallbacks.length === 0 ? (
                        <p className="text-xs text-dashbot-muted">No fallbacks configured.</p>
                      ) : (
                        <div className="space-y-2">
                          {modelFallbacks.map((fallback, index) => (
                            <div key={`${fallback}-${index}`} className="grid grid-cols-[36px_1fr_auto] items-center gap-2">
                              <span className="text-[11px] text-dashbot-muted text-right">#{index + 1}</span>
                              <select
                                value={fallback}
                                onChange={(e) => updateFallbackModel(index, e.target.value)}
                                className="w-full rounded bg-dashbot-bg border border-dashbot-border px-2 py-1.5 text-xs text-dashbot-text"
                              >
                                {modelOptions.map((model) => (
                                  <option key={model} value={model}>{model}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeFallbackModel(index)}
                                className="px-2 py-1 rounded text-[11px] font-medium text-red-300 border border-red-400/30 hover:bg-red-500/10"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-dashbot-text text-sm font-medium block mb-1.5">Default sub-agent model</label>
                      <select
                        value={subagentModel}
                        onChange={(e) => setSubagentModel(e.target.value)}
                        className="w-full rounded-lg bg-dashbot-surface border border-dashbot-border px-2.5 py-2 text-sm text-dashbot-text"
                      >
                        {modelOptions.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-dashbot-text text-sm font-medium block mb-1.5">Memory embedding model</label>
                        <select
                          value={embeddingModel}
                          onChange={(e) => setEmbeddingModel(e.target.value)}
                          className="w-full rounded-lg bg-dashbot-surface border border-dashbot-border px-2.5 py-2 text-sm text-dashbot-text"
                        >
                          <option value="">(none)</option>
                          {modelOptions.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-dashbot-text text-sm font-medium block mb-1.5">Memory fallback provider</label>
                        <input
                          value={memoryFallback}
                          onChange={(e) => setMemoryFallback(e.target.value)}
                          className="w-full rounded-lg bg-dashbot-surface border border-dashbot-border px-2.5 py-2 text-sm text-dashbot-text"
                          placeholder="gemini"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-dashbot-text text-sm font-medium block mb-1.5">Agent model assignments</label>
                      <div className="rounded-lg border border-dashbot-border bg-dashbot-surface/40 max-h-56 overflow-y-auto">
                        {agentModels.map((agent) => (
                          <div key={agent.id} className="grid grid-cols-[minmax(0,180px)_1fr] gap-2 items-center px-2.5 py-2 border-b last:border-b-0 border-dashbot-border">
                            <span className="text-xs text-dashbot-muted font-mono truncate" title={agent.id}>{agent.id}</span>
                            <select
                              value={agent.model}
                              onChange={(e) => updateAgentModel(agent.id, e.target.value)}
                              className="w-full rounded bg-dashbot-bg border border-dashbot-border px-2 py-1.5 text-xs text-dashbot-text"
                            >
                              {modelOptions.map((model) => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-dashbot-text text-sm font-medium block mb-1.5">Cron job model overrides</label>
                      <div className="rounded-lg border border-dashbot-border bg-dashbot-surface/40 max-h-52 overflow-y-auto">
                        {cronModels.length === 0 ? (
                          <p className="text-xs text-dashbot-muted px-2.5 py-2">No agentTurn cron jobs found.</p>
                        ) : cronModels.map((job) => (
                          <div key={job.id} className="grid grid-cols-[minmax(0,1fr)_1fr] gap-2 items-center px-2.5 py-2 border-b last:border-b-0 border-dashbot-border">
                            <div className="min-w-0">
                              <p className="text-xs text-dashbot-text truncate" title={job.name}>{job.name}</p>
                              <p className="text-[11px] text-dashbot-muted">{job.enabled ? 'Enabled' : 'Disabled'}</p>
                            </div>
                            <select
                              value={job.model}
                              onChange={(e) => updateCronModel(job.id, e.target.value)}
                              className="w-full rounded bg-dashbot-bg border border-dashbot-border px-2 py-1.5 text-xs text-dashbot-text"
                            >
                              {modelOptions.map((model) => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-dashbot-border rounded-lg border border-dashbot-border px-2.5">
                      <ToggleRow
                        label="Restart gateway after save"
                        description="Applies changes immediately (brief reconnect)"
                        enabled={restartGatewayOnModelChange}
                        onToggle={() => setRestartGatewayOnModelChange((v) => !v)}
                      />

                      <ToggleRow
                        label="Re-bind DashBot phone URL after restart"
                        description="Keeps Tailscale/Safari access working after gateway restarts"
                        enabled={ensurePhoneAccessAfterRestart}
                        onToggle={() => setEnsurePhoneAccessAfterRestart((v) => !v)}
                      />
                    </div>

                    <button
                      onClick={saveModelConfig}
                      disabled={modelSaving}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-dashbot-primary hover:opacity-90 disabled:opacity-50"
                    >
                      <Save className="size-3.5 inline mr-1" />
                      {modelSaving ? 'Saving…' : 'Save Model Settings'}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Memory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <Brain className="size-3.5 text-cyan-400" />
                  Memory
                </CardTitle>
                <CardDescription>Capture notes and reindex memory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-dashbot-text text-sm font-medium block mb-1.5">Quick memory note</label>
                    <textarea
                      value={memoryNote}
                      onChange={(e) => setMemoryNote(e.target.value)}
                      rows={3}
                      placeholder="Save a durable note for later recall…"
                      className="w-full rounded-lg bg-dashbot-surface border border-dashbot-border px-2.5 py-2 text-sm text-dashbot-text"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={saveMemoryNote}
                      disabled={memorySaving}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-dashbot-primary hover:opacity-90 disabled:opacity-50"
                    >
                      <Save className="size-3.5 inline mr-1" />
                      {memorySaving ? 'Saving…' : 'Save Note'}
                    </button>

                    <button
                      onClick={reindexMemory}
                      disabled={memoryReindexing}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-dashbot-text border border-dashbot-border hover:bg-dashbot-surface disabled:opacity-50"
                    >
                      <RefreshCw className={`size-3.5 inline mr-1 ${memoryReindexing ? 'animate-spin' : ''}`} />
                      {memoryReindexing ? 'Reindexing…' : 'Reindex Memory'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <Bell className="size-3.5 text-yellow-400" />
                  Notifications
                </CardTitle>
                <CardDescription>Desktop + sound alert preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 divide-y divide-dashbot-border">
                  <ToggleRow
                    label="Enable notifications"
                    description="Master switch for alerting"
                    enabled={notificationsEnabled}
                    onToggle={() => setNotificationsEnabled(v => !v)}
                  />

                  <ToggleRow
                    label="Desktop notifications"
                    description="Show browser notifications for important events"
                    enabled={desktopNotifications}
                    onToggle={() => setDesktopNotifications(v => !v)}
                  />

                  <ToggleRow
                    label="Sound notifications"
                    description="Play sound when alerts fire"
                    enabled={soundNotifications}
                    onToggle={() => setSoundNotifications(v => !v)}
                  />

                  <div className="pt-2">
                    <button
                      onClick={testNotification}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-dashbot-text border border-dashbot-border hover:bg-dashbot-surface"
                    >
                      <BellRing className="size-3.5 inline mr-1" />
                      Send Test Notification
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <MessageSquare className="size-3.5 text-blue-400" />
                  Chat
                </CardTitle>
                <CardDescription>Message and conversation settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-dashbot-text text-sm font-medium">Clear Chat History</p>
                    <p className="text-dashbot-muted text-xs mt-0.5">Delete all messages in the current session</p>
                  </div>
                  <button
                    onClick={clearChat}
                    className="px-2 py-1 rounded text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="size-3 inline mr-0.5" />
                    Clear
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <LogOut className="size-3.5 text-red-400" />
                  Account
                </CardTitle>
                <CardDescription>Sign out of DashBot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-dashbot-text text-sm font-medium">Logout</p>
                    <p className="text-dashbot-muted text-xs mt-0.5">Sign out and return to the login page</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to logout?')) {
                        router.delete('/logout')
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut className="size-3.5 inline mr-1" />
                    Logout
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
