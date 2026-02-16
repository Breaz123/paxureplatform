'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

export default function NieuwMeetingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titel: '',
    datum: new Date().toISOString().split('T')[0],
    notities: '',
    actiepunten: '',
    aanwezigen: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.titel.trim()) {
      setError('Vul een titel in')
      setSubmitting(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Niet ingelogd')
        setSubmitting(false)
        return
      }

      const actiepuntenArray = formData.actiepunten
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error: insertError } = await supabase
        .from('meetings')
        .insert({
          titel: formData.titel.trim(),
          datum: formData.datum,
          notities: formData.notities.trim() || null,
          actiepunten: actiepuntenArray.length > 0 ? actiepuntenArray : null,
          aanwezigen: formData.aanwezigen.trim() || null,
          created_by: user.id,
        })

      if (insertError) throw insertError

      router.push('/meetings')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Meetingverslag opslaan mislukt')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nieuw Meetingverslag</h1>
        <p className="text-muted-foreground">
          Leg een meetingverslag vast
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meetingverslag</CardTitle>
          <CardDescription>Vul de gegevens van de meeting in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input
                id="titel"
                value={formData.titel}
                onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                placeholder="Bijv. Wekelijkse teammeeting"
                required
              />
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
              <Label htmlFor="aanwezigen">Aanwezigen</Label>
              <Input
                id="aanwezigen"
                value={formData.aanwezigen}
                onChange={(e) => setFormData({ ...formData, aanwezigen: e.target.value })}
                placeholder="Namen van deelnemers, gescheiden door komma's"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                value={formData.notities}
                onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
                placeholder="Verslag en notities van de meeting..."
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
                {submitting ? 'Opslaan...' : 'Verslag Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
