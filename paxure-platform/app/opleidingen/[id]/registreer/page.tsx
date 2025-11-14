'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Opleiding, Profile } from '@/lib/types'

export default function RegistreerOpleidingPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const opleidingId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opleiding, setOpleiding] = useState<Opleiding | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profile[]>([])
  const [selectedMedewerker, setSelectedMedewerker] = useState<string>('')
  
  // Get medewerker from query params if provided
  const medewerkerFromParams = searchParams.get('medewerker')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load opleiding
        const { data: opleidingData, error: opleidingError } = await supabase
          .from('opleidingen')
          .select('*')
          .eq('id', opleidingId)
          .single()

        if (opleidingError || !opleidingData) {
          setError('Opleiding niet gevonden')
          setLoading(false)
          return
        }

        setOpleiding(opleidingData)

        // Load medewerkers (maatwerkers, coaches, hulpcoaches)
        const { data: medewerkersData, error: medewerkersError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['maatwerker', 'coach', 'hulpcoach'])
          .order('full_name')

        if (!medewerkersError && medewerkersData) {
          setMedewerkers(medewerkersData)
        }
      } catch (err) {
        setError('Fout bij laden van gegevens')
      } finally {
        setLoading(false)
      }
    }

    if (opleidingId) {
      loadData()
    }
  }, [opleidingId, supabase])

  // Set selected medewerker from query params
  useEffect(() => {
    if (medewerkerFromParams && medewerkers.length > 0) {
      if (medewerkers.some((m) => m.id === medewerkerFromParams)) {
        setSelectedMedewerker(medewerkerFromParams)
      }
    }
  }, [medewerkerFromParams, medewerkers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!selectedMedewerker) {
      setError('Selecteer een medewerker')
      setSubmitting(false)
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Niet ingelogd')
        setSubmitting(false)
        return
      }

      // Check if registration already exists
      const { data: existing } = await supabase
        .from('opleiding_registraties')
        .select('id')
        .eq('opleiding_id', opleidingId)
        .eq('medewerker_id', selectedMedewerker)
        .single()

      if (existing) {
        setError('Deze opleiding is al geregistreerd voor deze medewerker')
        setSubmitting(false)
        return
      }

      // Create registration
      const { error: insertError } = await supabase
        .from('opleiding_registraties')
        .insert({
          opleiding_id: opleidingId,
          medewerker_id: selectedMedewerker,
          geregistreerd_door: user.id,
          geregistreerd_op: new Date().toISOString(),
        })

      if (insertError) {
        throw insertError
      }

      router.push('/opleidingen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (!opleiding) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Opleiding niet gevonden</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Opleiding Registreren</h1>
        <p className="text-muted-foreground">
          Registreer deze opleiding als voltooid voor een medewerker
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{opleiding.taak}</CardTitle>
          {opleiding.deeltaak && (
            <CardDescription>{opleiding.deeltaak}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {opleiding.doel && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Doel:</p>
              <p className="text-sm text-muted-foreground">{opleiding.doel}</p>
            </div>
          )}
          {opleiding.duur && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Duur:</p>
              <p className="text-sm text-muted-foreground">{opleiding.duur}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registratie</CardTitle>
          <CardDescription>Selecteer de medewerker die deze opleiding heeft voltooid</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="medewerker">Medewerker *</Label>
              <Select
                value={selectedMedewerker}
                onValueChange={setSelectedMedewerker}
                required
              >
                <SelectTrigger id="medewerker">
                  <SelectValue placeholder="Selecteer medewerker" />
                </SelectTrigger>
                <SelectContent>
                  {medewerkers.map((medewerker) => (
                    <SelectItem key={medewerker.id} value={medewerker.id}>
                      {medewerker.full_name || medewerker.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {submitting ? 'Registreren...' : 'Opleiding Registreren'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

