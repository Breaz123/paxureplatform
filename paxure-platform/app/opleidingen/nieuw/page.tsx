'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagsInput } from '@/components/ui/tags-input'
import { createClient } from '@/lib/supabase/client'
import type { ProcesstapType, Profile } from '@/lib/types'

const processtappen: { value: ProcesstapType; label: string }[] = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'picking', label: 'Picking' },
  { value: 'packing', label: 'Packing' },
  { value: 'controle', label: 'Controle' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'vas', label: 'VAS' },
  { value: 'afwijkingen', label: 'Afwijkingen' },
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

export default function NieuweOpleidingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opleiders, setOpleiders] = useState<Profile[]>([])

  const [formData, setFormData] = useState({
    taak: '',
    deeltaak: '',
    doel: '',
    doelgroep: '',
    voorkennis_vereist: '',
    opleidingsmethode: '',
    duur: '',
    opleider_id: '',
    processtap: '' as ProcesstapType | '',
    capaciteiten_vereist: [] as string[],
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    async function loadOpleiders() {
      setLoading(true)
      try {
        const { data: opleidersData, error: opleidersError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer'])
          .order('full_name')

        if (!opleidersError && opleidersData) {
          setOpleiders(opleidersData)
        }
      } catch (err) {
        setError('Fout bij laden van opleiders')
      } finally {
        setLoading(false)
      }
    }

    loadOpleiders()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.taak) {
      setError('Taak is verplicht')
      setSubmitting(false)
      return
    }

    try {
      let documentId: string | null = null

      // Upload file if selected
      if (selectedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)
        uploadFormData.append('title', `${formData.taak} - Instructiemateriaal`)
        uploadFormData.append('description', `Instructiemateriaal voor opleiding: ${formData.taak}`)
        uploadFormData.append('document_type', 'opleiding')

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Bestand uploaden mislukt')
        }

        documentId = uploadResult.document.id
      }

      // Parse opleidingsmethode array
      const methodeArray = formData.opleidingsmethode
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error: insertError } = await supabase
        .from('opleidingen')
        .insert({
          taak: formData.taak,
          deeltaak: formData.deeltaak || null,
          doel: formData.doel || null,
          doelgroep: formData.doelgroep || null,
          voorkennis_vereist: formData.voorkennis_vereist || null,
          opleidingsmethode: methodeArray.length > 0 ? methodeArray : null,
          duur: formData.duur || null,
          opleider_id: formData.opleider_id || null,
          processtap: formData.processtap || null,
          capaciteiten_vereist: formData.capaciteiten_vereist.length > 0 ? formData.capaciteiten_vereist : null,
          document_id: documentId,
        })

      if (insertError) {
        throw insertError
      }

      router.push('/opleidingen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opleiding opslaan mislukt')
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nieuwe Opleiding</h1>
        <p className="text-muted-foreground">
          Maak een nieuwe opleiding aan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opleiding Details</CardTitle>
          <CardDescription>Vul de gegevens van de opleiding in</CardDescription>
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
                <Label htmlFor="taak">Taak *</Label>
                <Input
                  id="taak"
                  value={formData.taak}
                  onChange={(e) => setFormData({ ...formData, taak: e.target.value })}
                  placeholder="Bijv. Orderpicken"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deeltaak">Deeltaak</Label>
                <Input
                  id="deeltaak"
                  value={formData.deeltaak}
                  onChange={(e) => setFormData({ ...formData, deeltaak: e.target.value })}
                  placeholder="Bijv. Orderpicken bij klant X"
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
                <Label htmlFor="duur">Duur</Label>
                <Input
                  id="duur"
                  value={formData.duur}
                  onChange={(e) => setFormData({ ...formData, duur: e.target.value })}
                  placeholder="Bijv. 2 uur, 1 dag"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opleider_id">Opleider</Label>
                <Select
                  value={formData.opleider_id}
                  onValueChange={(value) => setFormData({ ...formData, opleider_id: value })}
                >
                  <SelectTrigger id="opleider_id">
                    <SelectValue placeholder="Selecteer opleider (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {opleiders.map((opleider) => (
                      <SelectItem key={opleider.id} value={opleider.id}>
                        {opleider.full_name || opleider.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doel">Doel</Label>
              <Textarea
                id="doel"
                value={formData.doel}
                onChange={(e) => setFormData({ ...formData, doel: e.target.value })}
                placeholder="Beschrijf het doel van deze opleiding"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doelgroep">Doelgroep</Label>
              <Textarea
                id="doelgroep"
                value={formData.doelgroep}
                onChange={(e) => setFormData({ ...formData, doelgroep: e.target.value })}
                placeholder="Voor wie is deze opleiding bedoeld?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voorkennis_vereist">Voorkennis Vereist</Label>
              <Textarea
                id="voorkennis_vereist"
                value={formData.voorkennis_vereist}
                onChange={(e) => setFormData({ ...formData, voorkennis_vereist: e.target.value })}
                placeholder="Welke voorkennis is vereist?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opleidingsmethode">Opleidingsmethode</Label>
              <Textarea
                id="opleidingsmethode"
                value={formData.opleidingsmethode}
                onChange={(e) => setFormData({ ...formData, opleidingsmethode: e.target.value })}
                placeholder="Één methode per regel&#10;Bijv. Theoretische uitleg&#10;Praktische demonstratie&#10;Onder begeleiding oefenen"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capaciteiten_vereist">Vereiste Capaciteiten / Vaardigheden</Label>
              <TagsInput
                value={formData.capaciteiten_vereist}
                onChange={(tags) => setFormData({ ...formData, capaciteiten_vereist: tags })}
                suggestions={capaciteitSuggesties}
                placeholder="Voeg vaardigheden toe die deze opleiding behandelt..."
              />
              <p className="text-sm text-muted-foreground">
                Selecteer welke vaardigheden/capaciteiten deze opleiding behandelt. Het systeem toont automatisch welke medewerkers deze opleiding nodig hebben.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Instructiemateriaal (Bestand of Video)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSelectedFile(file)
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.mp4,.mov,.avi,.wmv,.mp3,.wav,.jpg,.jpeg,.png,.gif"
              />
              <p className="text-sm text-muted-foreground">
                Upload een bestand of video als instructiemateriaal voor deze opleiding. Ondersteunde formaten: PDF, Word, Excel, Text, Video (MP4, MOV, AVI, WMV), Audio (MP3, WAV), Afbeeldingen (JPG, PNG, GIF)
              </p>
              {selectedFile && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-medium">Geselecteerd bestand:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
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
                {submitting ? 'Opslaan...' : 'Opleiding Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

