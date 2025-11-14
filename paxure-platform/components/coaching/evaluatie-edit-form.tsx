'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Evaluatie } from '@/lib/types'

interface EvaluatieEditFormProps {
  evaluatie: Evaluatie
}

export default function EvaluatieEditForm({ evaluatie }: EvaluatieEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    evaluatie_type: evaluatie.evaluatie_type || '',
    datum: evaluatie.datum.split('T')[0],
    notities: evaluatie.notities || '',
    actiepunten: evaluatie.actiepunten?.join('\n') || '',
    volgende_afspraak: evaluatie.volgende_afspraak ? evaluatie.volgende_afspraak.split('T')[0] : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Parse actiepunten
      const actiepuntenArray = formData.actiepunten
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error: updateError } = await supabase
        .from('evaluaties')
        .update({
          evaluatie_type: formData.evaluatie_type || null,
          datum: formData.datum,
          notities: formData.notities || null,
          actiepunten: actiepuntenArray.length > 0 ? actiepuntenArray : null,
          volgende_afspraak: formData.volgende_afspraak || null,
        })
        .eq('id', evaluatie.id)

      if (updateError) {
        throw updateError
      }

      router.refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bijwerken mislukt')
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluatie Bewerken</CardTitle>
        <CardDescription>Pas de evaluatie details aan</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

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
              placeholder="Één actiepunt per regel"
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
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

