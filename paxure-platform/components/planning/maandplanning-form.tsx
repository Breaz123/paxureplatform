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
import type { Maandplanning, Profile } from '@/lib/types'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

interface MaandplanningFormProps {
  initialData: Maandplanning | null
  maand: number
  jaar: number
  userId: string
}

const roles = ['pickers', 'inpakkers', 'controle', 'outbound', 'transport', 'vas'] as const
const roleLabels: Record<string, string> = {
  pickers: 'Pickers',
  inpakkers: 'Inpakkers',
  controle: 'Controle',
  outbound: 'Outbound',
  transport: 'Transport',
  vas: 'VAS',
}

const dagNamen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

// Get all days in month
function getDaysInMonth(maand: number, jaar: number): Array<{ date: Date; dayOfMonth: number; dayName: string }> {
  const days: Array<{ date: Date; dayOfMonth: number; dayName: string }> = []
  const firstDay = new Date(jaar, maand - 1, 1)
  const lastDay = new Date(jaar, maand, 0)
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(jaar, maand - 1, day)
    days.push({
      date,
      dayOfMonth: day,
      dayName: dagNamen[date.getDay()],
    })
  }
  
  return days
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function MaandplanningForm({
  initialData,
  maand,
  jaar,
  userId,
}: MaandplanningFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profile[]>([])

  const days = getDaysInMonth(maand, jaar)

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

  // Initialize form data - per day structure
  const [taakverdeling, setTaakverdeling] = useState<Record<string, Record<string, string[]>>>(() => {
    if (initialData?.taakverdeling) {
      const parsed = initialData.taakverdeling as Record<string, Record<string, string[]>>
      return parsed
    }
    return {}
  })

  const [opleidingsmomenten, setOpleidingsmomenten] = useState<Record<string, string[]>>(() => {
    if (initialData?.opleidingsmomenten) {
      const parsed = initialData.opleidingsmomenten as Record<string, string[]>
      return parsed
    }
    return {}
  })

  const [extraData, setExtraData] = useState({
    vas_opdrachten: initialData?.vas_opdrachten || '',
    speciale_taken: initialData?.speciale_taken || '',
    to_do_opvolgpunten: initialData?.to_do_opvolgpunten?.join('\n') || '',
  })

  const toggleMedewerker = (dayKey: string, role: string, medewerkerId: string) => {
    setTaakverdeling((prev) => {
      const dayData = prev[dayKey] || {}
      const roleData = dayData[role] || []
      const updated = roleData.includes(medewerkerId)
        ? roleData.filter((id) => id !== medewerkerId)
        : [...roleData, medewerkerId]
      
      return {
        ...prev,
        [dayKey]: {
          ...dayData,
          [role]: updated,
        },
      }
    })
  }

  const addOpleidingsmoment = (dayKey: string) => {
    setOpleidingsmomenten((prev) => {
      const current = prev[dayKey] || []
      return {
        ...prev,
        [dayKey]: [...current, ''],
      }
    })
  }

  const updateOpleidingsmoment = (dayKey: string, index: number, value: string) => {
    setOpleidingsmomenten((prev) => {
      const current = prev[dayKey] || []
      const updated = [...current]
      updated[index] = value
      return {
        ...prev,
        [dayKey]: updated.filter(Boolean),
      }
    })
  }

  const removeOpleidingsmoment = (dayKey: string, index: number) => {
    setOpleidingsmomenten((prev) => {
      const current = prev[dayKey] || []
      const updated = current.filter((_, i) => i !== index)
      return {
        ...prev,
        [dayKey]: updated,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Clean up empty days
      const cleanTaakverdeling = Object.fromEntries(
        Object.entries(taakverdeling).filter(([_, dayData]) => 
          Object.values(dayData).some((roleData) => roleData.length > 0)
        )
      )

      const cleanOpleidingsmomenten = Object.fromEntries(
        Object.entries(opleidingsmomenten).filter(([_, moments]) => moments.length > 0)
      )

      const dataToSave: any = {
        maand,
        jaar,
        taakverdeling: Object.keys(cleanTaakverdeling).length > 0 ? cleanTaakverdeling : null,
        opleidingsmomenten: Object.keys(cleanOpleidingsmomenten).length > 0 ? cleanOpleidingsmomenten : null,
        vas_opdrachten: extraData.vas_opdrachten || null,
        speciale_taken: extraData.speciale_taken || null,
        to_do_opvolgpunten: extraData.to_do_opvolgpunten
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        verantwoordelijke: userId,
      }

      if (initialData) {
        const { error: updateError } = await supabase
          .from('maandplanning')
          .update(dataToSave)
          .eq('id', initialData.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('maandplanning')
          .insert(dataToSave)

        if (insertError) throw insertError
      }

      router.push('/planning')
      router.refresh()
    } catch (err) {
      console.error('Error saving maandplanning:', err)
      setError(err instanceof Error ? err.message : 'Opslaan mislukt. Probeer het opnieuw.')
      setSubmitting(false)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!initialData?.id) {
      setError('Sla eerst de planning op voordat je exporteert')
      return
    }

    setExporting(format)
    setError(null)

    try {
      const response = await fetch(`/api/planning/maand/${initialData.id}/export?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Export mislukt')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `maandplanning-${maand}-${jaar}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Export mislukt')
    } finally {
      setExporting(null)
    }
  }

  const maandNamen = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maandplanning {maandNamen[maand - 1]} {jaar}</CardTitle>
              <CardDescription>
                Plan de maand per dag in. Selecteer medewerkers per rol en dag.
              </CardDescription>
            </div>
            {initialData?.id && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleExport('excel')}
                  disabled={exporting === 'excel'}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {exporting === 'excel' ? 'Exporteren...' : 'Excel'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting === 'pdf'}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {exporting === 'pdf' ? 'Exporteren...' : 'PDF'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {days.map((dayInfo) => {
            const dayKey = formatDate(dayInfo.date)
            const dayTaakverdeling = taakverdeling[dayKey] || {}
            const dayOpleidingsmomenten = opleidingsmomenten[dayKey] || []
            const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6

            return (
              <div 
                key={dayKey} 
                className={`border rounded-lg p-6 space-y-6 ${isWeekend ? 'bg-muted/30' : ''}`}
              >
                <h3 className="text-lg font-semibold">
                  {dayInfo.dayName} {dayInfo.dayOfMonth} {maandNamen[maand - 1]}
                </h3>

                {/* Taakverdeling per rol */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Taakverdeling</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                      <div key={role} className="space-y-2">
                        <Label className="text-sm font-semibold">{roleLabels[role]}</Label>
                        <div className="space-y-2 border rounded-md p-3 max-h-[200px] overflow-y-auto">
                          {loading ? (
                            <p className="text-xs text-muted-foreground">Laden...</p>
                          ) : medewerkers.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Geen medewerkers gevonden</p>
                          ) : (
                            medewerkers.map((medewerker) => {
                              const isSelected = dayTaakverdeling[role]?.includes(medewerker.id) || false
                              return (
                                <div key={medewerker.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${dayKey}_${role}_${medewerker.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleMedewerker(dayKey, role, medewerker.id)}
                                  />
                                  <label
                                    htmlFor={`${dayKey}_${role}_${medewerker.id}`}
                                    className="text-sm leading-none cursor-pointer flex-1"
                                  >
                                    {medewerker.full_name || medewerker.email}
                                  </label>
                                </div>
                              )
                            })
                          )}
                        </div>
                        {dayTaakverdeling[role]?.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {dayTaakverdeling[role].length} geselecteerd
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opleidingsmomenten */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opleidingsmomenten</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOpleidingsmoment(dayKey)}
                    >
                      + Toevoegen
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {dayOpleidingsmomenten.map((moment, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={moment}
                          onChange={(e) => updateOpleidingsmoment(dayKey, index, e.target.value)}
                          placeholder="Opleidingsmoment beschrijving..."
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOpleidingsmoment(dayKey, index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    {dayOpleidingsmomenten.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Geen opleidingsmomenten gepland voor deze dag
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overige Informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vas_opdrachten">VAS Opdrachten</Label>
            <Textarea
              id="vas_opdrachten"
              value={extraData.vas_opdrachten}
              onChange={(e) => setExtraData({ ...extraData, vas_opdrachten: e.target.value })}
              placeholder="Overzicht van VAS opdrachten voor deze maand"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speciale_taken">Speciale Taken of Transporten</Label>
            <Textarea
              id="speciale_taken"
              value={extraData.speciale_taken}
              onChange={(e) => setExtraData({ ...extraData, speciale_taken: e.target.value })}
              placeholder="Bijv. Wingparent lever- en ritmomenten per week"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_do_opvolgpunten">To Do & Opvolgpunten</Label>
            <Textarea
              id="to_do_opvolgpunten"
              value={extraData.to_do_opvolgpunten}
              onChange={(e) => setExtraData({ ...extraData, to_do_opvolgpunten: e.target.value })}
              placeholder="Één punt per regel&#10;Bijv. SOP's actualiseren?&#10;Evaluaties inplannen?"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Annuleren
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Opslaan...' : 'Maandplanning Opslaan'}
        </Button>
      </div>
    </form>
  )
}
