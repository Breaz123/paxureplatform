'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import type { Weekplanning, Profile } from '@/lib/types'

interface WeekplanningFormProps {
  initialData: Weekplanning | null
  weekStart: Date
  weekEnd: Date
  userId: string
}

const days = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'] as const
const roles = ['pickers', 'inpakkers', 'controle', 'outbound', 'transport', 'vas'] as const

const roleLabels: Record<string, string> = {
  pickers: 'Pickers',
  inpakkers: 'Inpakkers',
  controle: 'Controle',
  outbound: 'Outbound',
  transport: 'Transport',
  vas: 'VAS',
}

export default function WeekplanningForm({
  initialData,
  weekStart,
  weekEnd,
  userId,
}: WeekplanningFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profile[]>([])

  // Load medewerkers
  useEffect(() => {
    async function loadMedewerkers() {
      setLoading(true)
      try {
        const { data: medewerkersData, error: medewerkersError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['maatwerker', 'coach', 'hulpcoach'])
          .order('full_name')

        if (medewerkersError) {
          console.error('Error loading medewerkers:', medewerkersError)
          setError(`Fout bij laden van medewerkers: ${medewerkersError.message}`)
          setMedewerkers([])
        } else if (medewerkersData) {
          setMedewerkers(medewerkersData)
          console.log('Loaded medewerkers:', medewerkersData.length)
        } else {
          setMedewerkers([])
        }
      } catch (err) {
        console.error('Exception loading medewerkers:', err)
        setError('Fout bij laden van medewerkers')
        setMedewerkers([])
      } finally {
        setLoading(false)
      }
    }

    loadMedewerkers()
  }, [supabase])

  // Initialize form data with arrays instead of comma-separated strings
  const [formData, setFormData] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    days.forEach((day) => {
      roles.forEach((role) => {
        const key = `${day}_${role}` as const
        initial[key] = initialData?.[key] || []
      })
      initial[`${day}_afwezigheden`] = []
    })
    return initial
  })

  const [afwezigheden, setAfwezigheden] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    days.forEach((day) => {
      initial[day] = initialData?.[`${day}_afwezigheden` as keyof Weekplanning] as string || ''
    })
    return initial
  })

  const [extraData, setExtraData] = useState({
    speciale_leveringen: initialData?.speciale_leveringen || '',
    colruyt_transport: initialData?.colruyt_transport || '',
    wie_rijdt: initialData?.wie_rijdt || '',
  })

  const toggleMedewerker = (day: string, role: string, medewerkerId: string) => {
    const key = `${day}_${role}`
    setFormData((prev) => {
      const current = prev[key] || []
      const updated = current.includes(medewerkerId)
        ? current.filter((id) => id !== medewerkerId)
        : [...current, medewerkerId]
      console.log(`Toggle ${key}: ${medewerkerId}, updated:`, updated)
      return { ...prev, [key]: updated }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const dataToSave: any = {
        week_start: weekStart.toISOString().split('T')[0],
        week_einde: weekEnd.toISOString().split('T')[0],
        ingevuld_door: userId,
        ingevuld_op: new Date().toISOString(),
        ...extraData,
      }

      days.forEach((day) => {
        roles.forEach((role) => {
          const key = `${day}_${role}` as const
          dataToSave[key] = formData[key] || []
        })
        dataToSave[`${day}_afwezigheden`] = afwezigheden[day] || null
      })

      if (initialData) {
        const { error: updateError } = await supabase
          .from('weekplanning')
          .update(dataToSave)
          .eq('id', initialData.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('weekplanning')
          .insert(dataToSave)

        if (insertError) throw insertError
      }

      router.push('/planning')
      router.refresh()
    } catch (err) {
      console.error('Error saving weekplanning:', err)
      setError(err instanceof Error ? err.message : 'Opslaan mislukt. Probeer het opnieuw.')
      setSubmitting(false)
    }
  }

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      const newFormData: Record<string, string[]> = {}
      days.forEach((day) => {
        roles.forEach((role) => {
          const key = `${day}_${role}` as const
          newFormData[key] = initialData[key] || []
        })
      })
      setFormData(newFormData)

      const newAfwezigheden: Record<string, string> = {}
      days.forEach((day) => {
        newAfwezigheden[day] = initialData[`${day}_afwezigheden` as keyof Weekplanning] as string || ''
      })
      setAfwezigheden(newAfwezigheden)
    }
  }, [initialData])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {days.map((day) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="capitalize">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                  <div key={role} className="space-y-3">
                    <Label className="text-base font-semibold capitalize">
                      {roleLabels[role]}
                    </Label>
                    <div className="space-y-2 border rounded-md p-3 max-h-[200px] overflow-y-auto">
                      {loading ? (
                        <p className="text-sm text-muted-foreground">Laden...</p>
                      ) : medewerkers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Geen medewerkers gevonden. Controleer of er medewerkers zijn aangemaakt.
                        </p>
                      ) : (
                        medewerkers.map((medewerker) => {
                          const key = `${day}_${role}`
                          const isSelected = formData[key]?.includes(medewerker.id) || false
                          return (
                            <div key={medewerker.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${day}_${role}_${medewerker.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleMedewerker(day, role, medewerker.id)}
                              />
                              <label
                                htmlFor={`${day}_${role}_${medewerker.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {medewerker.full_name || medewerker.email}
                              </label>
                            </div>
                          )
                        })
                      )}
                    </div>
                    {formData[`${day}_${role}`]?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formData[`${day}_${role}`].length} geselecteerd
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${day}_afwezigheden`}>Afwezigheden & Opmerkingen</Label>
                <Textarea
                  id={`${day}_afwezigheden`}
                  value={afwezigheden[day] || ''}
                  onChange={(e) => setAfwezigheden({ ...afwezigheden, [day]: e.target.value })}
                  placeholder="Afwezigheden en opmerkingen voor deze dag..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bijzonderheden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="speciale_leveringen">Speciale leveringen of klantenafspraken</Label>
            <Textarea
              id="speciale_leveringen"
              value={extraData.speciale_leveringen}
              onChange={(e) => setExtraData({ ...extraData, speciale_leveringen: e.target.value })}
              placeholder="Klantnaam – dag – bijzonderheid"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="colruyt_transport">Colruyt-transport (Wingparent)</Label>
            <Textarea
              id="colruyt_transport"
              value={extraData.colruyt_transport}
              onChange={(e) => setExtraData({ ...extraData, colruyt_transport: e.target.value })}
              placeholder="Levering klaarzetten en rit details"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="wie_rijdt">Wie rijdt?</Label>
            <Input
              id="wie_rijdt"
              value={extraData.wie_rijdt}
              onChange={(e) => setExtraData({ ...extraData, wie_rijdt: e.target.value })}
              placeholder="Naam van chauffeur"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Annuleren
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Opslaan...' : 'Planning Opslaan'}
        </Button>
      </div>
    </form>
  )
}
