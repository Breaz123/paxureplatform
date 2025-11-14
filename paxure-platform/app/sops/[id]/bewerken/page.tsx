'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { ProcesstapType, SOP } from '@/lib/types'

const processtappen: { value: ProcesstapType; label: string }[] = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'picking', label: 'Picking' },
  { value: 'packing', label: 'Packing' },
  { value: 'controle', label: 'Controle' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'vas', label: 'VAS' },
  { value: 'afwijkingen', label: 'Afwijkingen' },
]

export default function SOPBewerkenPage() {
  const router = useRouter()
  const params = useParams()
  const sopId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sop, setSop] = useState<SOP | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    processtap: '' as ProcesstapType | '',
    doel: '',
    toepassingsgebied: '',
    materiaal_vereist: '',
    stap_voor_stap: '',
    kwaliteitscontrole: '',
    afwijkingen_handling: '',
    veiligheidsinstructies: '',
    training_vereist: false,
    volgende_herziening: '',
  })

  useEffect(() => {
    async function loadSOP() {
      setLoading(true)
      try {
        const { data: sopData, error: sopError } = await supabase
          .from('sops')
          .select('*')
          .eq('id', sopId)
          .single()

        if (sopError || !sopData) {
          setError('SOP niet gevonden')
          setLoading(false)
          return
        }

        setSop(sopData)
        setFormData({
          title: sopData.title || '',
          processtap: sopData.processtap || '',
          doel: sopData.doel || '',
          toepassingsgebied: sopData.toepassingsgebied || '',
          materiaal_vereist: sopData.materiaal_vereist?.join('\n') || '',
          stap_voor_stap: sopData.stap_voor_stap || '',
          kwaliteitscontrole: sopData.kwaliteitscontrole || '',
          afwijkingen_handling: sopData.afwijkingen_handling || '',
          veiligheidsinstructies: sopData.veiligheidsinstructies || '',
          training_vereist: sopData.training_vereist || false,
          volgende_herziening: sopData.volgende_herziening ? sopData.volgende_herziening.split('T')[0] : '',
        })
      } catch (err) {
        setError('Fout bij laden van SOP')
      } finally {
        setLoading(false)
      }
    }

    if (sopId) {
      loadSOP()
    }
  }, [sopId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.title) {
      setError('Titel is verplicht')
      setSubmitting(false)
      return
    }

    try {
      // Parse materiaal_vereist array
      const materiaalArray = formData.materiaal_vereist
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error: updateError } = await supabase
        .from('sops')
        .update({
          title: formData.title,
          processtap: formData.processtap || null,
          doel: formData.doel || null,
          toepassingsgebied: formData.toepassingsgebied || null,
          materiaal_vereist: materiaalArray.length > 0 ? materiaalArray : null,
          stap_voor_stap: formData.stap_voor_stap || null,
          kwaliteitscontrole: formData.kwaliteitscontrole || null,
          afwijkingen_handling: formData.afwijkingen_handling || null,
          veiligheidsinstructies: formData.veiligheidsinstructies || null,
          training_vereist: formData.training_vereist,
          volgende_herziening: formData.volgende_herziening || null,
        })
        .eq('id', sopId)

      if (updateError) {
        throw updateError
      }

      router.push(`/sops/${sopId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SOP bijwerken mislukt')
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

  if (!sop) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">SOP niet gevonden</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">SOP Bewerken</h1>
        <p className="text-muted-foreground">
          Bewerk de Standaard Werkprocedure
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SOP Details</CardTitle>
          <CardDescription>Pas de gegevens van de SOP aan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Bijv. SOP Orderpicken"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processtap">Processtap</Label>
                <Select
                  value={formData.processtap}
                  onValueChange={(value) => setFormData({ ...formData, processtap: value as ProcesstapType })}
                >
                  <SelectTrigger id="processtap">
                    <SelectValue placeholder="Selecteer processtap (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {processtappen.map((stap) => (
                      <SelectItem key={stap.value} value={stap.value}>
                        {stap.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volgende_herziening">Volgende Herziening</Label>
                <Input
                  id="volgende_herziening"
                  type="date"
                  value={formData.volgende_herziening}
                  onChange={(e) => setFormData({ ...formData, volgende_herziening: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doel">Doel</Label>
              <Textarea
                id="doel"
                value={formData.doel}
                onChange={(e) => setFormData({ ...formData, doel: e.target.value })}
                placeholder="Beschrijf het doel van deze SOP"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toepassingsgebied">Toepassingsgebied</Label>
              <Textarea
                id="toepassingsgebied"
                value={formData.toepassingsgebied}
                onChange={(e) => setFormData({ ...formData, toepassingsgebied: e.target.value })}
                placeholder="Waar is deze SOP van toepassing?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materiaal_vereist">Materiaal Vereist</Label>
              <Textarea
                id="materiaal_vereist"
                value={formData.materiaal_vereist}
                onChange={(e) => setFormData({ ...formData, materiaal_vereist: e.target.value })}
                placeholder="Één item per regel&#10;Bijv. Reachtruck&#10;Picking trolley"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stap_voor_stap">Stap voor Stap</Label>
              <Textarea
                id="stap_voor_stap"
                value={formData.stap_voor_stap}
                onChange={(e) => setFormData({ ...formData, stap_voor_stap: e.target.value })}
                placeholder="Beschrijf de stappen in detail"
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kwaliteitscontrole">Kwaliteitscontrole</Label>
              <Textarea
                id="kwaliteitscontrole"
                value={formData.kwaliteitscontrole}
                onChange={(e) => setFormData({ ...formData, kwaliteitscontrole: e.target.value })}
                placeholder="Hoe wordt de kwaliteit gecontroleerd?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="afwijkingen_handling">Afwijkingen Handling</Label>
              <Textarea
                id="afwijkingen_handling"
                value={formData.afwijkingen_handling}
                onChange={(e) => setFormData({ ...formData, afwijkingen_handling: e.target.value })}
                placeholder="Hoe worden afwijkingen afgehandeld?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="veiligheidsinstructies">Veiligheidsinstructies</Label>
              <Textarea
                id="veiligheidsinstructies"
                value={formData.veiligheidsinstructies}
                onChange={(e) => setFormData({ ...formData, veiligheidsinstructies: e.target.value })}
                placeholder="Belangrijke veiligheidsinstructies"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="training_vereist"
                checked={formData.training_vereist}
                onChange={(e) => setFormData({ ...formData, training_vereist: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="training_vereist" className="cursor-pointer">
                Training vereist voor deze SOP
              </Label>
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

