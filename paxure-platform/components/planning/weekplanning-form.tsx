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
import { MedewerkerSelect } from './medewerker-select'
import { FileSpreadsheet, FileText, Copy, ChevronDown, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WeekplanningFormProps {
  initialData: Weekplanning | null
  weekStart: Date
  weekEnd: Date
  userId: string
}

const days = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'] as const
const roles = ['pick', 'pack', 'controle', 'vas', 'coaches', 'administratie'] as const

const roleLabels: Record<string, string> = {
  pick: 'Pick',
  pack: 'Pack',
  controle: 'Controle',
  vas: 'VAS',
  coaches: 'Coaches',
  administratie: 'Administratie',
}

// Define which roles can be selected for each planning role
const roleFilters: Record<string, string[]> = {
  pick: ['maatwerker', 'coach', 'hulpcoach'],
  pack: ['maatwerker', 'coach', 'hulpcoach'],
  controle: ['maatwerker', 'coach', 'hulpcoach'],
  vas: ['maatwerker', 'coach', 'hulpcoach'],
  coaches: ['coach', 'hulpcoach'],
  administratie: ['coach', 'hulpcoach', 'admin', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'],
}

// Helper function to format date as YYYY-MM-DD in local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWerkdagen(werkdagen: number | null | undefined): string {
  if (!werkdagen || werkdagen === 5) return ''
  return `${werkdagen}/5`
}

function formatWerkregimeLabel(medewerker: Profile | undefined): string {
  if (!medewerker) return ''
  
  const parts: string[] = []
  
  if (medewerker.werkdagen_per_week && medewerker.werkdagen_per_week !== 5) {
    const werkdagen = formatWerkdagen(medewerker.werkdagen_per_week)
    if (werkdagen) parts.push(werkdagen)
  }
  
  if (medewerker.werkdagen_regime) {
    parts.push(medewerker.werkdagen_regime)
  }
  
  if (medewerker.werkdagen_dagen && medewerker.werkdagen_dagen.length > 0) {
    const dagenLabels: Record<string, string> = {
      maandag: 'Ma',
      dinsdag: 'Di',
      woensdag: 'Wo',
      donderdag: 'Do',
      vrijdag: 'Vr',
    }
    const dagenStr = medewerker.werkdagen_dagen
      .map(d => dagenLabels[d.toLowerCase()] || d)
      .join(', ')
    parts.push(`(${dagenStr})`)
  }
  
  return parts.join(' ')
}

// Check if a medewerker works on a specific day
function worksOnDay(medewerker: Profile | undefined, date: Date): boolean {
  if (!medewerker) return false
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay()
  
  // Convert to Dutch day names (JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, etc.)
  const dayNames: Record<number, string> = {
    1: 'maandag',
    2: 'dinsdag',
    3: 'woensdag',
    4: 'donderdag',
    5: 'vrijdag',
    0: 'zondag',
    6: 'zaterdag',
  }
  
  const currentDayName = dayNames[dayOfWeek]?.toLowerCase()
  if (!currentDayName) return false
  
  // If werkdagen_dagen is set, use that
  if (medewerker.werkdagen_dagen && medewerker.werkdagen_dagen.length > 0) {
    // Check if this day is in the werkdagen_dagen array (case-insensitive, trim whitespace)
    return medewerker.werkdagen_dagen.some(
      dag => dag.toLowerCase().trim() === currentDayName
    )
  }
  
  // If no specific days set, check werkdagen_per_week
  // If werkdagen_per_week is 5 or not set, assume they work all weekdays
  if (!medewerker.werkdagen_per_week || medewerker.werkdagen_per_week === 5) {
    // Check if it's a weekday (Monday-Friday)
    return dayOfWeek >= 1 && dayOfWeek <= 5
  }
  
  return false
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
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profile[]>([])
  const [verlofData, setVerlofData] = useState<any[]>([])

  // Load all medewerkers and verlof data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load medewerkers
        const { data: medewerkersData, error: medewerkersError } = await supabase
          .from('profiles')
          .select('*')
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

        // Load verlof for the week
        // Find verlof that overlaps with the week: start_datum <= weekEnd AND eind_datum >= weekStart
        const weekStartStr = formatDateLocal(weekStart)
        const weekEndStr = formatDateLocal(weekEnd)
        const { data: verlofEntries, error: verlofError } = await supabase
          .from('verlof')
          .select('*')
          .lte('start_datum', weekEndStr)
          .gte('eind_datum', weekStartStr)

        if (verlofError) {
          console.error('Error loading verlof:', verlofError)
          console.error('Error details:', {
            message: verlofError.message,
            details: verlofError.details,
            hint: verlofError.hint,
            code: verlofError.code
          })
          // Don't set error, just log it and continue with empty array
          setVerlofData([])
        } else {
          setVerlofData(verlofEntries || [])
        }
      } catch (err) {
        console.error('Exception loading data:', err)
        setError('Fout bij laden van data')
        setMedewerkers([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, weekStart, weekEnd])

  // Initialize form data with arrays instead of comma-separated strings
  // Also handle migration from old column names to new ones
  const [formData, setFormData] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    days.forEach((day) => {
      roles.forEach((role) => {
        const key = `${day}_${role}` as const
        // Try new column name first, then fall back to old names for migration
        let value = initialData?.[key] || []
        
        // Migration: map old column names to new ones
        if (value.length === 0 && initialData) {
          if (role === 'pick') {
            value = (initialData as any)[`${day}_pickers`] || []
          } else if (role === 'pack') {
            value = (initialData as any)[`${day}_inpakkers`] || []
          }
          // controle, vas stay the same
          // coaches and administratie are new, so they start empty
        }
        
        initial[key] = value
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

  const copyDayToDays = (sourceDay: string, targetDays: string[]) => {
    const newFormData = { ...formData }
    const newAfwezigheden = { ...afwezigheden }

    // Copy all role data for each target day
    targetDays.forEach((targetDay) => {
      roles.forEach((role) => {
        const sourceKey = `${sourceDay}_${role}`
        const targetKey = `${targetDay}_${role}`
        newFormData[targetKey] = [...(formData[sourceKey] || [])]
      })
      // Copy afwezigheden
      newAfwezigheden[targetDay] = afwezigheden[sourceDay] || ''
    })

    setFormData(newFormData)
    setAfwezigheden(newAfwezigheden)
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

      // Build data with new column names (after migration)
      days.forEach((day) => {
        roles.forEach((role) => {
          const key = `${day}_${role}` as const
          const value = formData[key] || []
          
          // Use new column names directly (migration has been applied)
          dataToSave[key] = value
        })
        dataToSave[`${day}_afwezigheden`] = afwezigheden[day] || null
      })

      if (initialData) {
        const { error: updateError } = await supabase
          .from('weekplanning')
          .update(dataToSave)
          .eq('id', initialData.id)

        if (updateError) {
          console.error('Update error details:', updateError)
          throw new Error(updateError.message || 'Fout bij updaten van planning')
        }
      } else {
        const { error: insertError } = await supabase
          .from('weekplanning')
          .insert(dataToSave)
          .select()

        if (insertError) {
          console.error('Insert error details:', insertError)
          throw new Error(insertError.message || 'Fout bij aanmaken van planning')
        }
      }

      router.push('/planning')
      router.refresh()
    } catch (err: any) {
      console.error('Error saving weekplanning:', err)
      let errorMessage = 'Opslaan mislukt. Probeer het opnieuw.'
      
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.code) {
        errorMessage = `Database fout (${err.code}): ${err.message || 'Onbekende fout'}`
      } else if (err?.hint) {
        errorMessage = `Database fout: ${err.hint}`
      }
      
      // Check if it's a column not found error
      if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        errorMessage = 'Database kolommen zijn nog niet bijgewerkt. Voer de migratie uit: supabase/migrations/20240101000008_update_weekplanning_roles.sql'
      }
      
      setError(errorMessage)
      setSubmitting(false)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    const planningId = initialData?.id
    if (!planningId) {
      setError('Sla eerst de planning op voordat je exporteert')
      return
    }

    setExporting(format)
    setError(null)

    try {
      const response = await fetch(`/api/planning/week/${planningId}/export?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Export mislukt')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const weekStr = weekStart.toISOString().split('T')[0]
      a.download = `weekplanning-${weekStr}.${format === 'excel' ? 'xlsx' : 'pdf'}`
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

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      const newFormData: Record<string, string[]> = {}
      days.forEach((day) => {
        roles.forEach((role) => {
          const key = `${day}_${role}` as const
          // Try new column name first, then fall back to old names for migration
          let value = initialData[key] || []
          
          // Migration: map old column names to new ones
          if (value.length === 0) {
            if (role === 'pick') {
              value = (initialData as any)[`${day}_pickers`] || []
            } else if (role === 'pack') {
              value = (initialData as any)[`${day}_inpakkers`] || []
            }
          }
          
          newFormData[key] = value
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
        {days.map((day) => {
          const otherDays = days.filter((d) => d !== day)
          return (
          <Card key={day}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{day}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Kopieer naar
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {otherDays.map((targetDay) => (
                      <DropdownMenuItem
                        key={targetDay}
                        onClick={() => copyDayToDays(day, [targetDay])}
                        className="capitalize"
                      >
                        {targetDay}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => copyDayToDays(day, otherDays)}
                      className="font-semibold"
                    >
                      Alle andere dagen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => {
                  const key = `${day}_${role}`
                  // Filter medewerkers based on role
                  const allowedRoles = roleFilters[role] || []
                  const filteredMedewerkers = medewerkers.filter((m) => 
                    allowedRoles.includes(m.role)
                  )
                  return (
                    <div key={role} className="space-y-3">
                      <Label className="text-base font-semibold">
                        {roleLabels[role]}
                      </Label>
                      {loading ? (
                        <p className="text-sm text-muted-foreground">Laden...</p>
                      ) : filteredMedewerkers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Geen medewerkers gevonden voor deze rol.
                        </p>
                      ) : (
                        <MedewerkerSelect
                          value={formData[key] || []}
                          onChange={(ids) => setFormData({ ...formData, [key]: ids })}
                          medewerkers={filteredMedewerkers}
                          placeholder={`Zoek ${roleLabels[role].toLowerCase()}...`}
                          verlofData={verlofData}
                          currentDate={(() => {
                            // Get date for this day
                            const dayIndex = days.indexOf(day)
                            const date = new Date(weekStart)
                            date.setDate(weekStart.getDate() + dayIndex)
                            return date
                          })()}
                        />
                      )}
                      {formData[key]?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formData[key].length} geselecteerd
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Verlof en Werkregime sectie */}
              <div className="space-y-4 border-t pt-4">
                {/* Get date for this day */}
                {(() => {
                  const dayIndex = days.indexOf(day)
                  const date = new Date(weekStart)
                  date.setDate(weekStart.getDate() + dayIndex)
                  const dateStr = formatDateLocal(date)
                  
                  // Get verlof for this day
                  const verlofForDay = verlofData.filter(
                    (verlof) => verlof.start_datum <= dateStr && verlof.eind_datum >= dateStr
                  )
                  
                  // Get medewerkers who don't work on this day (werkregime)
                  const werkregimeMedewerkers = medewerkers.filter((medewerker) => {
                    const worksToday = worksOnDay(medewerker, date)
                    const hasWerkregime = !!(medewerker.werkdagen_per_week && medewerker.werkdagen_per_week !== 5) || 
                                         !!(medewerker.werkdagen_regime) || 
                                         !!(medewerker.werkdagen_dagen && medewerker.werkdagen_dagen.length > 0)
                    return !worksToday && hasWerkregime
                  })
                  
                  return (
                    <>
                      {/* Verlof sectie */}
                      {verlofForDay.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Verlof
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {verlofForDay.map((verlof) => {
                              const medewerker = medewerkers.find((m) => m.id === verlof.medewerker_id)
                              const medewerkerName = medewerker?.full_name || medewerker?.email || 'Onbekend'
                              const verlofTypeColors: Record<string, string> = {
                                verlof: 'bg-blue-100 text-blue-800 border-blue-300',
                                ziekte: 'bg-red-100 text-red-800 border-red-300',
                                feestdag: 'bg-purple-100 text-purple-800 border-purple-300',
                                andere: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                              }
                              
                              return (
                                <Badge
                                  key={verlof.id}
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    verlofTypeColors[verlof.type] || verlofTypeColors.andere
                                  )}
                                  title={`${medewerkerName} - ${verlof.type}${verlof.opmerking ? `: ${verlof.opmerking}` : ''}`}
                                >
                                  {medewerkerName.split(' ')[0]} - {verlof.type}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Werkregime sectie */}
                      {werkregimeMedewerkers.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Werkregime (Vrije dag)</Label>
                          <div className="flex flex-wrap gap-2">
                            {werkregimeMedewerkers.map((medewerker) => {
                              const werkregimeLabel = formatWerkregimeLabel(medewerker)
                              return (
                                <Badge
                                  key={medewerker.id}
                                  variant="outline"
                                  className="bg-green-100 text-green-800 border-green-300 text-xs"
                                  title={`${medewerker.full_name || medewerker.email} - Werkregime: ${werkregimeLabel} (vrije dag)`}
                                >
                                  {medewerker.full_name?.split(' ')[0] || medewerker.email} - {werkregimeLabel}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
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
          )
        })}
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

      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel' || submitting || !initialData?.id}
            title={!initialData?.id ? 'Sla eerst de planning op om te exporteren' : 'Exporteer naar Excel'}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {exporting === 'excel' ? 'Exporteren...' : 'Excel'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf' || submitting || !initialData?.id}
            title={!initialData?.id ? 'Sla eerst de planning op om te exporteren' : 'Exporteer naar PDF'}
          >
            <FileText className="mr-2 h-4 w-4" />
            {exporting === 'pdf' ? 'Exporteren...' : 'PDF'}
          </Button>
        </div>
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting || exporting !== null}>
            Annuleren
          </Button>
          <Button type="submit" disabled={submitting || exporting !== null}>
            {submitting ? 'Opslaan...' : 'Planning Opslaan'}
          </Button>
        </div>
      </div>
    </form>
  )
}
