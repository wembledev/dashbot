import { useState, useEffect, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sun, Moon, Monitor, Trash2, MessageSquare, Brain, Bell, Cpu, LogOut } from 'lucide-react'
import HelpButton from '@/components/status/help-button'
import { useCarMode } from '@/contexts/car-mode-context'

type ThemePreference = 'system' | 'dark' | 'light'

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

function SoonBadge() {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
      Soon
    </span>
  )
}

export default function SettingsIndex() {
  const [themePref, setThemePref] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashbot-theme') as ThemePreference) || 'system'
    }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') return resolveTheme(themePref)
    return 'dark'
  })

  const { carMode, toggleCarMode } = useCarMode()

  const updateResolved = useCallback((pref: ThemePreference) => {
    const resolved = resolveTheme(pref)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  useEffect(() => {
    localStorage.setItem('dashbot-theme', themePref)
    updateResolved(themePref)
  }, [themePref, updateResolved])

  // Watch system preference changes when "system" is selected
  useEffect(() => {
    if (themePref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => updateResolved('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themePref, updateResolved])

  const clearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      router.delete('/dashboard/messages')
    }
  }

  const themeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div className="h-full overflow-y-auto bg-dashbot-bg">
      <div className="px-2 sm:px-3 pb-3">
        <div>
          <div className="mb-2 mt-2 flex items-center justify-between">
            <h1 className="text-sm sm:text-base font-medium text-dashbot-text">Settings</h1>
            <HelpButton
              topic="Settings"
              context="DashBot Settings page. Configure appearance (system/dark/light theme, car mode for Tesla browser), chat settings (clear history), and manage your session. Models, Memory, and Notifications sections are coming soon. What settings are available? How does car mode work?"
            />
          </div>

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
                  {/* Theme selector */}
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
                    <p className="text-dashbot-muted text-xs mt-1.5">
                      {themePref === 'system' ? 'Follows your operating system preference' :
                       themePref === 'light' ? 'Always use light colors' : 'Always use dark colors'}
                    </p>
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

            {/* Models (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <Cpu className="size-3.5 text-violet-400" />
                  Models
                  <SoonBadge />
                </CardTitle>
                <CardDescription>AI model assignments and fallback hierarchy</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-dashbot-muted text-xs">Choose default model, set fallback hierarchy, and configure per-session overrides.</p>
              </CardContent>
            </Card>

            {/* Memory (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <Brain className="size-3.5 text-cyan-400" />
                  Memory
                  <SoonBadge />
                </CardTitle>
                <CardDescription>Vector search index and memory management</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-dashbot-muted text-xs">Save notes, browse memory files, re-index vectors, and manage the knowledge base.</p>
              </CardContent>
            </Card>

            {/* Notifications (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-dashbot-text">
                  <Bell className="size-3.5 text-yellow-400" />
                  Notifications
                  <SoonBadge />
                </CardTitle>
                <CardDescription>Telegram pings, card alerts, digest frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-dashbot-muted text-xs">Control when and how the agent notifies you about new items.</p>
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
