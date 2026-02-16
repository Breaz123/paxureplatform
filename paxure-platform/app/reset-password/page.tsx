'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid password reset token in the URL hash
    const checkToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        // Supabase SSR client will automatically process the hash tokens
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verify we have a valid session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setIsValidToken(true)
          // Clear the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname)
        } else {
          setIsValidToken(false)
        }
      } else {
        // Check if user already has a valid session (in case they refreshed the page)
        const { data: { session } } = await supabase.auth.getSession()
        setIsValidToken(!!session)
      }
    }

    checkToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er is een fout opgetreden.'
      setError(message)
      setLoading(false)
    }
  }

  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Laden...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Paxure_CMYK_2025_Icoon.png"
                alt="Paxure Logo"
                width={64}
                height={64}
                className="h-16 w-16"
              />
            </div>
            <CardTitle>Ongeldige link</CardTitle>
            <CardDescription>
              Deze wachtwoord reset link is ongeldig of verlopen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-destructive">
                De link die je hebt gebruikt is ongeldig of verlopen. Vraag een nieuwe reset link aan.
              </div>
              <Link href="/forgot-password">
                <Button className="w-full">Nieuwe reset link aanvragen</Button>
              </Link>
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-primary hover:underline"
                >
                  Terug naar inloggen
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/Paxure_CMYK_2025_Icoon.png"
              alt="Paxure Logo"
              width={64}
              height={64}
              className="h-16 w-16"
            />
          </div>
          <CardTitle>Nieuw wachtwoord instellen</CardTitle>
          <CardDescription>
            Voer een nieuw wachtwoord in voor je account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="text-sm text-green-600 dark:text-green-400">
                Je wachtwoord is succesvol gewijzigd! Je wordt doorgestuurd naar de login pagina...
              </div>
              <Link href="/login">
                <Button className="w-full">Naar inloggen</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nieuw wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Wachtwoord wijzigen...' : 'Wachtwoord wijzigen'}
              </Button>
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-primary hover:underline"
                >
                  Terug naar inloggen
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
