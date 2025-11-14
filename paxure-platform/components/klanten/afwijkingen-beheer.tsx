'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface AfwijkingenBeheerProps {
  klantId: string
  initialAfwijkingen: any[]
}

export default function AfwijkingenBeheer({ klantId, initialAfwijkingen }: AfwijkingenBeheerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [afwijkingen, setAfwijkingen] = useState(initialAfwijkingen)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    titel: '',
    beschrijving: '',
    prioriteit: 'normaal',
    opgelost: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.titel) {
      setError('Titel is verplicht')
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

      const { error: insertError } = await supabase
        .from('klantflow_afwijkingen')
        .insert({
          klant_id: klantId,
          titel: formData.titel,
          beschrijving: formData.beschrijving || null,
          prioriteit: formData.prioriteit,
          opgelost: formData.opgelost,
          geregistreerd_door: user.id,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Refresh afwijkingen
      router.refresh()
      setFormData({ titel: '', beschrijving: '', prioriteit: 'normaal', opgelost: false })
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Afwijking toevoegen mislukt')
      setSubmitting(false)
    }
  }

  const handleToggleOpgelost = async (afwijkingId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('klantflow_afwijkingen')
        .update({ opgelost: !currentStatus })
        .eq('id', afwijkingId)

      if (updateError) {
        throw updateError
      }

      router.refresh()
    } catch (err) {
      console.error('Error updating afwijking:', err)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Afwijkingen</CardTitle>
              <CardDescription>Beheer afwijkingen voor deze klant</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Annuleren' : 'Nieuwe Afwijking'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 pb-6 border-b">
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
                  placeholder="Bijv. Koeltransport vereist"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beschrijving">Beschrijving</Label>
                <Textarea
                  id="beschrijving"
                  value={formData.beschrijving}
                  onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
                  placeholder="Details over de afwijking..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioriteit">Prioriteit</Label>
                <select
                  id="prioriteit"
                  value={formData.prioriteit}
                  onChange={(e) => setFormData({ ...formData, prioriteit: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="laag">Laag</option>
                  <option value="normaal">Normaal</option>
                  <option value="hoog">Hoog</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? 'Toevoegen...' : 'Afwijking Toevoegen'}
              </Button>
            </form>
          )}

          {afwijkingen && afwijkingen.length > 0 ? (
            <div className="space-y-4">
              {afwijkingen.map((afwijking: any) => (
                <Card key={afwijking.id} className={afwijking.opgelost ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{afwijking.titel}</h3>
                          <Badge
                            variant={
                              afwijking.prioriteit === 'urgent'
                                ? 'destructive'
                                : afwijking.prioriteit === 'hoog'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {afwijking.prioriteit}
                          </Badge>
                          {afwijking.opgelost && (
                            <Badge variant="outline">Opgelost</Badge>
                          )}
                        </div>
                        {afwijking.beschrijving && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {afwijking.beschrijving}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(afwijking.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <Button
                        variant={afwijking.opgelost ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleOpgelost(afwijking.id, afwijking.opgelost)}
                      >
                        {afwijking.opgelost ? 'Markeer als Open' : 'Markeer als Opgelost'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Geen afwijkingen gevonden</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

