import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
}

export default function Login({ token }: Props) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    try {
      const res = await fetch(`/login/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Login failed')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dashbot-bg text-dashbot-text flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardHeader>
            <div className="text-7xl mb-4">✅</div>
            <CardTitle className="text-3xl font-light tracking-wider">You're In!</CardTitle>
            <CardDescription>You'll be logged in automatically on your other device. You can close this window.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dashbot-bg text-dashbot-text flex items-center justify-center">
      <Card className="w-96 text-center">
        <CardHeader>
          <div className="text-5xl mb-4">🔐</div>
          <CardTitle className="font-light tracking-wider">Enter Password</CardTitle>
          <CardDescription>This is your secure login</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="input text-center"
              autoFocus
            />
            {error && <p className="text-dashbot-danger text-sm">{error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
