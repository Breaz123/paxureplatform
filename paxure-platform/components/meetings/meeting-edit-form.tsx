'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { Meeting } from '@/lib/types'

interface MeetingEditFormProps {
  meeting: Meeting
}

export default function MeetingEditForm({ meeting }: MeetingEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titel: meeting.titel,
    datum: meeting.datum.split('T')[0],
    notities: meeting.notities || '',
    actiepunten: meeting.actiepunten?.join('\n') || '',
    aanwezigen: meeting.aanwezigen || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const actiepuntenArray = formData.actiepunten
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          titel: formData.titel.trim(),
          datum: formData.datum,
          notities: formData.notities.trim() || null,
          actiepunten: actiepuntenArray.length > 0 ? actiepuntenArray : null,
          aanwezigen: formData.aanwezigen.trim() || null,
        })
        .eq('id', meeting.id)

      if (updateError) throw updateError

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
        <CardTitle>Meetingverslag Bewerken</CardTitle>
        <CardDescription>Pas het verslag aan</CardDescription>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notities">Notities</Label>
            <Textarea
              id="notities"
              value={formData.notities}
              onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actiepunten">Actiepunten</Label>
            <Textarea
              id="actiepunten"
              value={formData.actiepunten}
              onChange={(e) => setFormData({ ...formData, actiepunten: e.target.value })}
              rows={4}
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
