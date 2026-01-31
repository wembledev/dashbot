import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function useCountdown(expiresAt: string | null) {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()
    function tick() {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSeconds(remaining)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return seconds
}

export default function QrLogin() {
  const [qrData, setQrData] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loginUrl, setLoginUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  const seconds = useCountdown(expiresAt)
  const expired = seconds === 0

  useEffect(() => {
    let cancelled = false
    async function fetchQR() {
      setLoading(true)
      try {
        const res = await fetch('/qr')
        const data = await res.json()
        if (!cancelled) {
          setQrData(data.qr_data)
          setToken(data.token)
          setExpiresAt(data.expires_at)
          setLoginUrl(data.login_url)
        }
      } catch (e) {
        console.error('Failed to generate QR:', e)
      }
      if (!cancelled) setLoading(false)
    }
    fetchQR()
    return () => { cancelled = true }
  }, [refreshCount])

  useEffect(() => {
    if (!token || expired) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/qr/${token}/status`)
        const data = await res.json()
        if (data.logged_in) window.location.href = '/dashboard'
      } catch (e) {
        console.error('Status check failed:', e)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [token, expired])

  const handleRefresh = useCallback(() => {
    setRefreshCount(c => c + 1)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-dashbot-bg text-dashbot-text flex items-center justify-center">
      <Card className="w-96 text-center">
        <CardHeader>
          <div className="text-7xl mb-4">🤖</div>
          <CardTitle className="text-3xl font-light tracking-wider">DashBot</CardTitle>
          <CardDescription>Scan with your phone to login</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="bg-white p-4 rounded-2xl inline-block shadow-[0_0_24px_rgba(255,255,255,0.06)]">
            {loading ? (
              <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                Generating...
              </div>
            ) : expired ? (
              <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                QR expired
              </div>
            ) : (
              <img src={qrData!} alt="Login QR Code" className="w-56 h-56" />
            )}
          </div>

          {seconds != null && !loading && (
            <p className={`text-sm ${expired ? 'text-dashbot-danger' : 'text-dashbot-muted'}`}>
              {expired ? 'Expired — refresh to get a new code' : `Expires in ${formatTime(seconds)}`}
            </p>
          )}

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleRefresh} disabled={loading} className="min-w-[120px]">
              {expired ? 'New QR' : 'Refresh QR'}
            </Button>
            {loginUrl && !expired && (
              <Button variant="secondary" asChild className="min-w-[120px]">
                <a href={loginUrl} target="_blank" rel="noopener noreferrer">
                  Dev Login
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
