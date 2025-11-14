'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function NieuweEvaluatiePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profile[]>([])
  
  const [formData, setFormData] = useState({
    medewerker_id: '',
    evaluatie_type: '',
    datum: new Date().toISOString().split('T')[0],
    notities: '',
    actiepunten: '',
    volgende_afspraak: '',
  })

  useEffect(() => {
    async function loadMedewerkers() {
      setLoading(true)
      try {
        const { data: medewerkersData, error: medewerkersError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['maatwerker'])
          .order('full_name')

        if (!medewerkersError && medewerkersData) {
          setMedewerkers(medewerkersData)
        }
      } catch (err) {
        setError('Fout bij laden van medewerkers')
      } finally {
        setLoading(false)
      }
    }

    loadMedewerkers()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.medewerker_id) {
      setError('Selecteer een medewerker')
      setSubmitting(false)
      return
    }

    try {
      // Get current user (coach)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Niet ingelogd')
        setSubmitting(false)
        return
      }

      // Parse actiepunten
      const actiepuntenArray = formData.actiepunten
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error: insertError } = await supabase
        .from('evaluaties')
        .insert({
          medewerker_id: formData.medewerker_id,
          coach_id: user.id,
          evaluatie_type: formData.evaluatie_type || null,
          datum: formData.datum,
          notities: formData.notities || null,
          actiepunten: actiepuntenArray.length > 0 ? actiepuntenArray : null,
          volgende_afspraak: formData.volgende_afspraak || null,
        })

      if (insertError) {
        throw insertError
      }

      router.push('/coaching')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluatie opslaan mislukt')
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

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nieuwe Evaluatie</h1>
        <p className="text-muted-foreground">
          Registreer een nieuwe coaching sessie of evaluatie
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluatie Details</CardTitle>
          <CardDescription>Vul de gegevens van de evaluatie in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="medewerker_id">Medewerker *</Label>
              <Select
                value={formData.medewerker_id}
                onValueChange={(value) => setFormData({ ...formData, medewerker_id: value })}
                required
              >
                <SelectTrigger id="medewerker_id">
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

            <div className="space-y-2">
              <Label htmlFor="evaluatie_type">Type Evaluatie</Label>
              <Select
                value={formData.evaluatie_type}
                onValueChange={(value) => setFormData({ ...formData, evaluatie_type: value })}
              >
                <SelectTrigger id="evaluatie_type">
                  <SelectValue placeholder="Selecteer type (optioneel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wekelijks">Wekelijks Gesprek</SelectItem>
                  <SelectItem value="maandelijks">Maandelijks Gesprek</SelectItem>
                  <SelectItem value="beoordeling">Beoordeling</SelectItem>
                  <SelectItem value="voortgang">Voortgangsgesprek</SelectItem>
                  <SelectItem value="andere">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="datum">Datum *</Label>
              <Input
                id="datum"
                type="date"
                value={formData.datum}
                onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                placeholder="Notities van het gesprek..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actiepunten">Actiepunten</Label>
              <Textarea
                id="actiepunten"
                value={formData.actiepunten}
                onChange={(e) => setFormData({ ...formData, actiepunten: e.target.value })}
                placeholder="Één actiepunt per regel&#10;Bijv. Extra oefening met reachtruck&#10;Opleiding VAS voltooien"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volgende_afspraak">Volgende Afspraak</Label>
              <Input
                id="volgende_afspraak"
                type="date"
                value={formData.volgende_afspraak}
                onChange={(e) => setFormData({ ...formData, volgende_afspraak: e.target.value })}
              />
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
                {submitting ? 'Opslaan...' : 'Evaluatie Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

