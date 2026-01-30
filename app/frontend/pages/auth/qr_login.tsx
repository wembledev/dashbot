import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function QrLogin() {
  const [qrData, setQrData] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loginUrl, setLoginUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

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
    if (!token) return
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
  }, [token])

  const handleRefresh = useCallback(() => {
    setRefreshCount(c => c + 1)
  }, [])

  return (
    <div className="min-h-screen bg-dashbot-bg text-dashbot-text flex items-center justify-center">
      <Card className="w-80 text-center">
        <CardHeader>
          <div className="text-7xl mb-4">🤖</div>
          <CardTitle className="text-3xl">Dashbot</CardTitle>
          <CardDescription>Scan with your phone to login</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="bg-white p-4 rounded-xl inline-block">
            {loading ? (
              <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                Generating...
              </div>
            ) : (
              <img src={qrData!} alt="Login QR Code" className="w-56 h-56" />
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              Refresh QR
            </Button>
            {loginUrl && (
              <Button variant="secondary" asChild>
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
