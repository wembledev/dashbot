import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

const stack = ['Rails', 'Inertia', 'React', 'TypeScript', 'Tailwind v4', 'shadcn/ui']

const vibes = [
  { bg: 'bg-gradient-to-br from-slate-950 to-black', label: 'Get Started' },
  { bg: 'bg-gradient-to-br from-purple-950 to-black', label: 'Cosmic' },
  { bg: 'bg-gradient-to-br from-emerald-950 to-black', label: 'Matrix' },
  { bg: 'bg-gradient-to-br from-orange-950 to-black', label: 'Ember' },
  { bg: 'bg-gradient-to-br from-cyan-950 to-black', label: 'Deep Sea' },
]

export default function HomeIndex() {
  const [vibe, setVibe] = useState(0)

  const next = () => setVibe((v) => (v + 1) % vibes.length)

  return (
    <div className={`min-h-screen text-dashbot-text flex items-center justify-center transition-all duration-700 ${vibes[vibe].bg}`}>
      <Card className="w-80 text-center">
        <CardHeader>
          <div className="text-7xl mb-4">🤖</div>
          <CardTitle className="text-3xl">Dashbot</CardTitle>
          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
            {stack.map((name) => (
              <span key={name} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
        </CardHeader>
        <div className="p-6 pt-0 flex gap-2 justify-center">
          <Button onClick={next}>{vibes[vibe].label}</Button>
          <Button variant="outline" onClick={() => router.delete('/logout')}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  )
}
