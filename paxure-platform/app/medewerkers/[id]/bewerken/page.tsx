'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/lib/types'
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

export default function MedewerkerBewerkenPage() {
  const router = useRouter()
  const params = useParams()
  const medewerkerId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medewerker, setMedewerker] = useState<Profile | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    role: '' as UserRole | '',
    capaciteiten_goed: [] as string[],
    capaciteiten_gemiddeld: [] as string[],
    capaciteiten_slecht: [] as string[],
  })

  useEffect(() => {
    async function loadMedewerker() {
      setLoading(true)
      try {
        const { data, error: loadError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', medewerkerId)
          .single()

        if (loadError) {
          throw loadError
        }

        if (data) {
          setMedewerker(data)
          setFormData({
            full_name: data.full_name || '',
            role: data.role,
            capaciteiten_goed: data.capaciteiten_goed || [],
            capaciteiten_gemiddeld: data.capaciteiten_gemiddeld || [],
            capaciteiten_slecht: data.capaciteiten_slecht || [],
          })
        }
      } catch (err) {
        console.error('Error loading medewerker:', err)
        setError('Fout bij laden van medewerker')
      } finally {
        setLoading(false)
      }
    }

    if (medewerkerId) {
      loadMedewerker()
    }
  }, [medewerkerId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Je bent niet ingelogd. Log opnieuw in.')
        setSubmitting(false)
        return
      }

      // Check if user has permission to update profiles
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const allowedRoles = ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer']
      const canManage = userProfile && allowedRoles.includes(userProfile.role)

      // Allow users to update their own profile, or coaches to update any profile
      if (!canManage && user.id !== medewerkerId) {
        setError('Je hebt geen rechten om deze medewerker te bewerken. Alleen coaches en hogere rollen kunnen medewerkers bewerken.')
        setSubmitting(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          role: formData.role || 'maatwerker',
          capaciteiten_goed: formData.capaciteiten_goed.length > 0 ? formData.capaciteiten_goed : null,
          capaciteiten_gemiddeld: formData.capaciteiten_gemiddeld.length > 0 ? formData.capaciteiten_gemiddeld : null,
          capaciteiten_slecht: formData.capaciteiten_slecht.length > 0 ? formData.capaciteiten_slecht : null,
        })
        .eq('id', medewerkerId)

      if (updateError) {
        // Extract more detailed error message from Supabase error
        let errorMessage = 'Bijwerken mislukt'
        
        if (updateError.message) {
          errorMessage = updateError.message
          
          // Translate common Supabase RLS errors to user-friendly messages
          if (updateError.message.includes('permission denied') || updateError.message.includes('violates row-level security')) {
            errorMessage = 'Je hebt geen rechten om deze wijziging door te voeren. Neem contact op met een beheerder.'
          } else if (updateError.message.includes('new row violates row-level security')) {
            errorMessage = 'Je hebt geen rechten om medewerkers te bewerken. Alleen coaches en hogere rollen hebben deze rechten.'
          }
        }
        
        throw new Error(errorMessage)
      }

      router.push('/medewerkers')
      router.refresh()
    } catch (err) {
      console.error('Error updating medewerker:', err)
      setError(err instanceof Error ? err.message : 'Bijwerken mislukt')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (!medewerker) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Medewerker niet gevonden</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Medewerker Bewerken</h1>
        <p className="text-muted-foreground">
          Bewerk de gegevens van {medewerker.full_name || medewerker.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medewerker Details</CardTitle>
          <CardDescription>
            Wijzig de gegevens van de medewerker
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={medewerker.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email kan niet worden gewijzigd</p>
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
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecteer rol" />
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
                {submitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

