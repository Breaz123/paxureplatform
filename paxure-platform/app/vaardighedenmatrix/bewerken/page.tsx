'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Vaardighedenmatrix, VaardigheidScore } from '@/lib/types'

const vaardigheden = [
  { key: 'orderpicken', label: 'Orderpicken' },
  { key: 'inpakken', label: 'Inpakken' },
  { key: 'controle', label: 'Controle' },
  { key: 'reachtruck', label: 'Reachtruck' },
  { key: 'vas', label: 'VAS' },
  { key: 'wingparentflow', label: 'Wingparentflow' },
] as const

const scoreOptions: { value: VaardigheidScore; label: string }[] = [
  { value: '0', label: 'Niet opgeleid' },
  { value: '1', label: 'Onder begeleiding' },
  { value: '2', label: 'Zelfstandig' },
  { value: 'ja', label: 'Ja' },
  { value: 'nee', label: 'Nee' },
]

export default function VaardighedenmatrixBewerkenPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profile[]>([])
  const [selectedMedewerker, setSelectedMedewerker] = useState<string>('')
  const [existingEntry, setExistingEntry] = useState<Vaardighedenmatrix | null>(null)

  const [formData, setFormData] = useState({
    orderpicken: '' as VaardigheidScore | '',
    inpakken: '' as VaardigheidScore | '',
    controle: '' as VaardigheidScore | '',
    reachtruck: '' as VaardigheidScore | '',
    vas: '' as VaardigheidScore | '',
    wingparentflow: '' as VaardigheidScore | '',
    status: 'actief',
    opmerkingen: '',
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

  useEffect(() => {
    async function loadExistingEntry() {
      if (!selectedMedewerker) {
        setExistingEntry(null)
        return
      }

      try {
        const { data: entry, error } = await supabase
          .from('vaardighedenmatrix')
          .select('*')
          .eq('medewerker_id', selectedMedewerker)
          .eq('status', 'actief')
          .single()

        if (!error && entry) {
          setExistingEntry(entry)
          setFormData({
            orderpicken: entry.orderpicken || '',
            inpakken: entry.inpakken || '',
            controle: entry.controle || '',
            reachtruck: entry.reachtruck || '',
            vas: entry.vas || '',
            wingparentflow: entry.wingparentflow || '',
            status: entry.status || 'actief',
            opmerkingen: entry.opmerkingen || '',
          })
        } else {
          setExistingEntry(null)
          setFormData({
            orderpicken: '' as VaardigheidScore | '',
            inpakken: '' as VaardigheidScore | '',
            controle: '' as VaardigheidScore | '',
            reachtruck: '' as VaardigheidScore | '',
            vas: '' as VaardigheidScore | '',
            wingparentflow: '' as VaardigheidScore | '',
            status: 'actief',
            opmerkingen: '',
          })
        }
      } catch (err) {
        console.error('Error loading entry:', err)
      }
    }

    loadExistingEntry()
  }, [selectedMedewerker, supabase])

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Niet ingelogd')
        setSubmitting(false)
        return
      }

      const dataToSave: any = {
        medewerker_id: selectedMedewerker,
        orderpicken: formData.orderpicken || null,
        inpakken: formData.inpakken || null,
        controle: formData.controle || null,
        reachtruck: formData.reachtruck || null,
        vas: formData.vas || null,
        wingparentflow: formData.wingparentflow || null,
        status: formData.status,
        opmerkingen: formData.opmerkingen || null,
        aangepast_door: user.id,
      }

      if (existingEntry) {
        await supabase
          .from('vaardighedenmatrix')
          .update(dataToSave)
          .eq('id', existingEntry.id)
      } else {
        await supabase.from('vaardighedenmatrix').insert(dataToSave)
      }

      router.push('/vaardighedenmatrix')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
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
        <h1 className="text-3xl font-bold">Vaardighedenmatrix Bewerken</h1>
        <p className="text-muted-foreground">
          Bewerk de vaardighedenmatrix voor een medewerker
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matrix Details</CardTitle>
          <CardDescription>Vul de vaardigheden in voor een medewerker</CardDescription>
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

            {selectedMedewerker && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {vaardigheden.map((vaardigheid) => (
                    <div key={vaardigheid.key} className="space-y-2">
                      <Label htmlFor={vaardigheid.key}>{vaardigheid.label}</Label>
                      <Select
                        value={formData[vaardigheid.key]}
                        onValueChange={(value) =>
                          setFormData({ ...formData, [vaardigheid.key]: value as VaardigheidScore })
                        }
                      >
                        <SelectTrigger id={vaardigheid.key}>
                          <SelectValue placeholder="Selecteer score" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Geen score</SelectItem>
                          {scoreOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actief">Actief</SelectItem>
                      <SelectItem value="inactief">Inactief</SelectItem>
                      <SelectItem value="gearchiveerd">Gearchiveerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opmerkingen">Opmerkingen</Label>
                  <Textarea
                    id="opmerkingen"
                    value={formData.opmerkingen}
                    onChange={(e) => setFormData({ ...formData, opmerkingen: e.target.value })}
                    placeholder="Optionele opmerkingen..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={submitting || !selectedMedewerker}>
                {submitting ? 'Opslaan...' : 'Matrix Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

