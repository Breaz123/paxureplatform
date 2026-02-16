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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabaseReady, setSupabaseReady] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupabaseReady(true)
    } else {
      setError('Supabase is niet geconfigureerd. Controleer je .env.local bestand.')
    }
  }, [])
  
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabaseReady) {
      setError('Supabase is niet geconfigureerd.')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het inloggen.'
      if (message === 'Failed to fetch') {
        setError(
          'Kan geen verbinding maken met de server. Controleer je internetverbinding. ' +
          'Als je Supabase gebruikt: controleer of je project actief is (niet gepauzeerd) op dashboard.supabase.com.'
        )
      } else {
        setError(message)
      }
      setLoading(false)
    }
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
          <CardTitle>Inloggen</CardTitle>
          <CardDescription>Log in op je Paxure Platform account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="naam@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Wachtwoord</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/forgot-password')
                  }}
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inloggen...' : 'Inloggen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

