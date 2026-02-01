import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sun, Moon, Trash2, MessageSquare, Brain, Bell, Cpu, LogOut } from 'lucide-react'
import HelpButton from '@/components/status/help-button'

function ToggleRow({ label, description, enabled, onToggle }: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-zinc-200 text-sm font-medium">{label}</p>
        <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-zinc-700'
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

function SoonBadge() {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
      Soon
    </span>
  )
}

export default function SettingsIndex() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashbot-theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })

  const [carMode, setCarMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashbot_car_mode') === 'true'
    }
    return false
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashbot-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('dashbot_car_mode', String(carMode))
    document.documentElement.classList.toggle('car-mode', carMode)
  }, [carMode])

  const clearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      router.delete('/dashboard/messages')
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="px-2 sm:px-3 pb-3">
        <div>
          <div className="mb-2 mt-2 flex items-center justify-between">
            <h1 className="text-sm sm:text-base font-medium text-zinc-100">Settings</h1>
            <HelpButton
              topic="Settings"
              context="DashBot Settings page. Configure appearance (dark/light mode, car mode for Tesla browser), chat settings (clear history), and manage your session. Models, Memory, and Notifications sections are coming soon. What settings are available? How does car mode work?"
            />
          </div>

          <div className="space-y-2">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-zinc-200">
                  {theme === 'dark' ? <Moon className="size-3.5 text-indigo-400" /> : <Sun className="size-3.5 text-amber-400" />}
                  Appearance
                </CardTitle>
                <CardDescription>Theme and display preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 divide-y divide-zinc-800">
                  <ToggleRow
                    label="Light Mode"
                    description="Switch to a light color scheme"
                    enabled={theme === 'light'}
                    onToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  />
                  <ToggleRow
                    label="Car Mode"
                    description="Larger text and buttons for driving (Tesla browser)"
                    enabled={carMode}
                    onToggle={() => setCarMode(prev => !prev)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-zinc-200">
                  <MessageSquare className="size-3.5 text-blue-400" />
                  Chat
                </CardTitle>
                <CardDescription>Message and conversation settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-zinc-200 text-sm font-medium">Clear Chat History</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Delete all messages in the current session</p>
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
                <CardTitle className="flex items-center gap-1.5 text-zinc-200">
                  <Cpu className="size-3.5 text-violet-400" />
                  Models
                  <SoonBadge />
                </CardTitle>
                <CardDescription>AI model assignments and fallback hierarchy</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-500 text-xs">Choose default model, set fallback hierarchy, and configure per-session overrides.</p>
              </CardContent>
            </Card>

            {/* Memory (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-zinc-200">
                  <Brain className="size-3.5 text-cyan-400" />
                  Memory
                  <SoonBadge />
                </CardTitle>
                <CardDescription>Vector search index and memory management</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-500 text-xs">Save notes, browse memory files, re-index vectors, and manage the knowledge base.</p>
              </CardContent>
            </Card>

            {/* Notifications (coming soon) */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-zinc-200">
                  <Bell className="size-3.5 text-yellow-400" />
                  Notifications
                  <SoonBadge />
                </CardTitle>
                <CardDescription>Telegram pings, card alerts, digest frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-500 text-xs">Control when and how the agent notifies you about new items.</p>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-zinc-200">
                  <LogOut className="size-3.5 text-red-400" />
                  Account
                </CardTitle>
                <CardDescription>Sign out of DashBot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-zinc-200 text-sm font-medium">Logout</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Sign out and return to the login page</p>
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
