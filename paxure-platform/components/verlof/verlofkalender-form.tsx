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
import type { Verlof, Profile } from '@/lib/types'
import { Calendar, Plus, Trash2, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import VerlofCalendar from './verlof-calendar'

interface VerlofkalenderFormProps {
  initialVerlof: (Verlof & { medewerker?: Profile })[]
  medewerkers: Profile[]
  canEdit: boolean
  currentUserId: string
}

export default function VerlofkalenderForm({
  initialVerlof,
  medewerkers,
  canEdit,
  currentUserId,
}: VerlofkalenderFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [verlofEntries, setVerlofEntries] = useState(initialVerlof)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Update verlof entries when initialVerlof prop changes
  useEffect(() => {
    setVerlofEntries(initialVerlof)
  }, [initialVerlof])

  const [formData, setFormData] = useState({
    medewerker_id: '',
    start_datum: '',
    eind_datum: '',
    type: 'verlof',
    opmerking: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.medewerker_id || !formData.start_datum || !formData.eind_datum) {
        throw new Error('Vul alle verplichte velden in')
      }

      // Validate date range
      if (new Date(formData.start_datum) > new Date(formData.eind_datum)) {
        throw new Error('Eind datum moet na start datum liggen')
      }

      const dataToSave = {
        medewerker_id: formData.medewerker_id,
        start_datum: formData.start_datum,
        eind_datum: formData.eind_datum,
        type: formData.type || 'verlof',
        opmerking: formData.opmerking || null,
        created_by: currentUserId,
      }

      console.log('Saving verlof data:', dataToSave)

      if (editingId) {
        const { data: updateData, error: updateError } = await supabase
          .from('verlof')
          .update(dataToSave)
          .eq('id', editingId)
          .select(`
            *,
            medewerker:profiles!verlof_medewerker_id_fkey(id, full_name, email)
          `)

        if (updateError) {
          console.error('Update error details:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          })
          throw updateError
        }

        // Update local state with medewerker info
        if (updateData && updateData.length > 0) {
          const updatedVerlof = updateData[0]
          // Find medewerker info
          const medewerker = medewerkers.find((m) => m.id === updatedVerlof.medewerker_id)
          setVerlofEntries((prev) =>
            prev.map((v) => (v.id === editingId ? { ...updatedVerlof, medewerker } : v))
          )
        }
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('verlof')
          .insert(dataToSave)
          .select('*')

        if (insertError) {
          console.error('Insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          })
          throw insertError
        }

        // Add to local state with medewerker info
        if (insertData && insertData.length > 0) {
          const newVerlof = insertData[0]
          // Find medewerker info
          const medewerker = medewerkers.find((m) => m.id === newVerlof.medewerker_id)
          setVerlofEntries((prev) => [...prev, { ...newVerlof, medewerker }])
        }
      }

      router.refresh()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        medewerker_id: '',
        start_datum: '',
        eind_datum: '',
        type: 'verlof',
        opmerking: '',
      })
    } catch (err: any) {
      console.error('Error saving verlof:', err)
      const errorMessage = err?.message || err?.details || err?.hint || 'Fout bij opslaan van verlof'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit verlof wilt verwijderen?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('verlof')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setVerlofEntries((prev) => prev.filter((v) => v.id !== id))
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting verlof:', err)
      setError(err.message || 'Fout bij verwijderen van verlof')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (verlof: Verlof) => {
    setFormData({
      medewerker_id: verlof.medewerker_id,
      start_datum: verlof.start_datum,
      eind_datum: verlof.eind_datum,
      type: verlof.type,
      opmerking: verlof.opmerking || '',
    })
    setEditingId(verlof.id)
    setShowForm(true)
  }

  const getMedewerkerName = (id: string) => {
    const medewerker = medewerkers.find((m) => m.id === id)
    return medewerker?.full_name || medewerker?.email || 'Onbekend'
  }

  // Group verlof by medewerker
  const verlofByMedewerker = verlofEntries.reduce((acc, verlof) => {
    const key = verlof.medewerker_id
    if (!acc[key]) acc[key] = []
    acc[key].push(verlof)
    return acc
  }, {} as Record<string, (Verlof & { medewerker?: Profile })[]>)

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {canEdit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Verlof Toevoegen</CardTitle>
                <CardDescription>
                  Voeg nieuw verlof, ziekte of andere afwezigheid toe
                </CardDescription>
              </div>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuw Verlof
                </Button>
              )}
            </div>
          </CardHeader>
          {showForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verlof">Verlof</SelectItem>
                        <SelectItem value="ziekte">Ziekte</SelectItem>
                        <SelectItem value="feestdag">Feestdag</SelectItem>
                        <SelectItem value="andere">Andere</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_datum">Start Datum *</Label>
                    <Input
                      id="start_datum"
                      type="date"
                      value={formData.start_datum}
                      onChange={(e) => setFormData({ ...formData, start_datum: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eind_datum">Eind Datum *</Label>
                    <Input
                      id="eind_datum"
                      type="date"
                      value={formData.eind_datum}
                      onChange={(e) => setFormData({ ...formData, eind_datum: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opmerking">Opmerking</Label>
                  <Textarea
                    id="opmerking"
                    value={formData.opmerking}
                    onChange={(e) => setFormData({ ...formData, opmerking: e.target.value })}
                    placeholder="Optionele opmerking..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {editingId ? 'Bijwerken' : 'Toevoegen'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setFormData({
                        medewerker_id: '',
                        start_datum: '',
                        eind_datum: '',
                        type: 'verlof',
                        opmerking: '',
                      })
                    }}
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      <VerlofCalendar
        verlofEntries={verlofEntries}
        medewerkers={medewerkers}
      />

      <Card>
        <CardHeader>
          <CardTitle>Verlof Overzicht</CardTitle>
          <CardDescription>Alle geregistreerde verlof en afwezigheden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(verlofByMedewerker).map(([medewerkerId, verlofList]) => (
              <div key={medewerkerId} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">
                  {getMedewerkerName(medewerkerId)}
                </h3>
                <div className="space-y-2">
                  {verlofList.map((verlof) => (
                    <div
                      key={verlof.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(verlof.start_datum).toLocaleDateString('nl-NL')} -{' '}
                            {new Date(verlof.eind_datum).toLocaleDateString('nl-NL')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {verlof.type.charAt(0).toUpperCase() + verlof.type.slice(1)}
                            {verlof.opmerking && ` - ${verlof.opmerking}`}
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(verlof)}
                          >
                            Bewerken
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(verlof.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {verlofEntries.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nog geen verlof geregistreerd
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

