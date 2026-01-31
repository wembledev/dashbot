import { useState, useRef, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Settings, Trash2, Sun, Moon } from 'lucide-react'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashbot-theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashbot-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    setOpen(false)
  }

  const clearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      router.delete('/dashboard/messages')
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-1.5 sm:p-2 rounded-full text-dashbot-muted hover:text-dashbot-text hover:bg-[rgba(255,255,255,0.05)] transition-all"
        aria-label="Settings"
      >
        <Settings className="size-3.5 sm:size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-dashbot-surface border border-dashbot-border shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden z-50">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-dashbot-text hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div className="border-t border-dashbot-border" />
          <button
            onClick={clearChat}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <Trash2 className="size-4" />
            Clear Chat
          </button>
        </div>
      )}
    </div>
  )
}
