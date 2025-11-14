'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { VaardighedenTagsInput } from '@/components/ui/vaardigheden-tags-input'

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'business_developer', label: 'Business Developer' },
  { value: 'operationeel_verantwoordelijke', label: 'Operationeel Verantwoordelijke' },
  { value: 'coach', label: 'Coach' },
  { value: 'hulpcoach', label: 'Hulpcoach' },
  { value: 'maatwerker', label: 'Maatwerker' },
]

const capaciteitSuggesties = [
  'picking',
  'inpakken',
  'controle',
  'outbound',
  'transport',
  'vas',
  'reachtruck',
  'wingparentflow',
  'inbound',
  'afwijkingen',
]

export default function NieuweMedewerkerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '' as UserRole | '',
    password: '',
    capaciteiten_goed: [] as string[],
    capaciteiten_gemiddeld: [] as string[],
    capaciteiten_slecht: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Email en wachtwoord zijn verplicht')
      setSubmitting(false)
      return
    }

    try {
      // Create medewerker via API route (needs admin access)
      const response = await fetch('/api/medewerkers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role || 'maatwerker',
          capaciteiten_goed: formData.capaciteiten_goed,
          capaciteiten_gemiddeld: formData.capaciteiten_gemiddeld,
          capaciteiten_slecht: formData.capaciteiten_slecht,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = data.error || 'Medewerker aanmaken mislukt'
        
        // Provide user-friendly error messages
        if (response.status === 401) {
          errorMessage = 'Je bent niet ingelogd. Log opnieuw in.'
        } else if (response.status === 403 || errorMessage.includes('Forbidden')) {
          errorMessage = 'Je hebt geen rechten om medewerkers aan te maken. Alleen coaches en hogere rollen kunnen medewerkers toevoegen.'
        } else if (response.status === 500 && errorMessage.includes('Service role key')) {
          errorMessage = 'Server configuratie fout. Neem contact op met een beheerder.'
        }
        
        throw new Error(errorMessage)
      }

      router.push('/medewerkers')
      router.refresh()
    } catch (err) {
      console.error('Error creating medewerker:', err)
      setError(err instanceof Error ? err.message : 'Medewerker aanmaken mislukt')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nieuwe Medewerker</h1>
        <p className="text-muted-foreground">
          Voeg een nieuwe medewerker toe aan het systeem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medewerker Details</CardTitle>
          <CardDescription>
            Vul de gegevens van de medewerker in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="medewerker@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Volledige Naam</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Jan Jansen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimaal 6 tekens"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecteer rol (standaard: Maatwerker)" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Capaciteiten / Vaardigheden</Label>
              <VaardighedenTagsInput
                goed={formData.capaciteiten_goed}
                gemiddeld={formData.capaciteiten_gemiddeld}
                slecht={formData.capaciteiten_slecht}
                onChange={(goed, gemiddeld, slecht) => 
                  setFormData({ ...formData, capaciteiten_goed: goed, capaciteiten_gemiddeld: gemiddeld, capaciteiten_slecht: slecht })
                }
                suggestions={capaciteitSuggesties}
              />
              <p className="text-sm text-muted-foreground">
                Categoriseer vaardigheden per niveau. Dit helpt om te bepalen wie welke opleiding nodig heeft.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Aanmaken...' : 'Medewerker Aanmaken'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

