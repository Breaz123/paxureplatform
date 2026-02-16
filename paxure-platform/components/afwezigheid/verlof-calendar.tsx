'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Verlof, Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VerlofCalendarProps {
  verlofEntries: (Verlof & { medewerker?: Profile })[]
  medewerkers: Profile[]
  onDateClick?: (date: Date, verlof: (Verlof & { medewerker?: Profile })[]) => void
}

const maandNamen = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
]

const dagNamen = ['Ma', 'Di', 'Wo', 'Do', 'Vr'] // Only weekdays, no weekend

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

// Color mapping for verlof types
const verlofTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  verlof: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700'
  },
  ziekte: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700'
  },
  feestdag: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700'
  },
  andere: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700'
  },
  werkregime: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700'
  }
}

export default function VerlofCalendar({
  verlofEntries,
  medewerkers,
  onDateClick
}: VerlofCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0

    const days: Array<{ date: Date; dayOfMonth: number; isCurrentMonth: boolean }> = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        dayOfMonth: prevMonthLastDay - i,
        isCurrentMonth: false
      })
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        dayOfMonth: day,
        isCurrentMonth: true
      })
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        dayOfMonth: day,
        isCurrentMonth: false
      })
    }

    return days
  }

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    // Use local timezone to avoid timezone issues
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get verlof for a specific date (using local time)
  const getVerlofForDate = (date: Date) => {
    const dateStr = formatDateLocal(date)
    return verlofEntries.filter((verlof) => {
      // Compare dates as strings (YYYY-MM-DD format) to avoid timezone issues
      // The dates from the database are already in YYYY-MM-DD format
      return verlof.start_datum <= dateStr && verlof.eind_datum >= dateStr
    })
  }

  // Group verlof by medewerker for a date
  const getVerlofByMedewerker = (date: Date) => {
    const verlofForDate = getVerlofForDate(date)
    const grouped: Record<string, (Verlof & { medewerker?: Profile })[]> = {}

    verlofForDate.forEach((verlof) => {
      const medewerkerId = verlof.medewerker_id
      if (!grouped[medewerkerId]) {
        grouped[medewerkerId] = []
      }
      grouped[medewerkerId].push(verlof)
    })

    return grouped
  }

  const days = getDaysInMonth(currentMonth, currentYear)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleMonthChange = (month: string) => {
    setCurrentDate(new Date(currentYear, parseInt(month) - 1, 1))
  }

  const handleYearChange = (year: string) => {
    setCurrentDate(new Date(parseInt(year), currentMonth, 1))
  }

  // Generate year options
  const currentYearNum = new Date().getFullYear()
  const jaren = Array.from({ length: 5 }, (_, i) => currentYearNum - 2 + i)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Afwezigheid Kalender</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={(currentMonth + 1).toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {maandNamen.map((naam, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {naam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentYear.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jaren.map((jaar) => (
                  <SelectItem key={jaar} value={jaar.toString()}>
                    {jaar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1">
          {/* Day headers - only weekdays */}
          {dagNamen.map((dag) => (
            <div
              key={dag}
              className="p-2 text-center text-sm font-semibold text-muted-foreground"
            >
              {dag}
            </div>
          ))}

          {/* Calendar days - only show weekdays (Monday-Friday) */}
          {days
            .filter((day) => {
              // Only show weekdays (Monday = 1, Friday = 5)
              const dayOfWeek = day.date.getDay()
              return dayOfWeek >= 1 && dayOfWeek <= 5
            })
            .map((day, index) => {
              const isToday =
                day.date.toDateString() === today.toDateString() &&
                day.isCurrentMonth
              const verlofForDay = getVerlofByMedewerker(day.date)
              const hasVerlof = Object.keys(verlofForDay).length > 0

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[100px] border rounded-md p-1 text-sm',
                    day.isCurrentMonth
                      ? 'bg-background'
                      : 'bg-muted/30 text-muted-foreground',
                    isToday && 'ring-2 ring-primary',
                    hasVerlof && 'cursor-pointer hover:bg-accent/50'
                  )}
                  onClick={() => {
                    if (hasVerlof && onDateClick) {
                      onDateClick(day.date, getVerlofForDate(day.date))
                    }
                  }}
                >
                <div
                  className={cn(
                    'text-xs font-medium mb-1',
                    isToday && 'text-primary font-bold'
                  )}
                >
                  {day.dayOfMonth}
                </div>
                <div className="space-y-0.5">
                  {/* Show verlof entries */}
                  {Object.entries(verlofForDay).map(([medewerkerId, verlofList]) => {
                    // Try to get medewerker from verlof entry first (includes relation data), then from medewerkers array
                    const medewerkerFromVerlof = verlofList[0]?.medewerker
                    const medewerker = medewerkerFromVerlof || medewerkers.find((m) => m.id === medewerkerId)
                    const medewerkerName = medewerker?.full_name || medewerker?.email || 'Onbekend'
                    
                    return (
                      <div key={medewerkerId} className="space-y-0.5">
                        {verlofList.map((verlof) => {
                          const colors = verlofTypeColors[verlof.type] || verlofTypeColors.andere
                          const titleParts = [
                            `${medewerkerName} - ${verlof.type}`,
                            verlof.opmerking && `Opmerking: ${verlof.opmerking}`
                          ].filter(Boolean)
                          
                          return (
                            <div
                              key={verlof.id}
                              className={cn(
                                'text-xs px-1 py-0.5 rounded border',
                                colors.bg,
                                colors.text,
                                colors.border
                              )}
                              title={titleParts.join(' | ')}
                            >
                              <div className="truncate">
                                {medewerkerName.split(' ')[0]} - {verlof.type}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  
                  {/* Show werkregime labels for medewerkers who DON'T work on this day (their free day) */}
                  {medewerkers
                    .filter((medewerker) => {
                      // Only show if they DON'T work today and have a werkregime (part-time)
                      const worksToday = worksOnDay(medewerker, day.date)
                      const hasWerkregime = !!(medewerker.werkdagen_per_week && medewerker.werkdagen_per_week !== 5) || 
                                           !!(medewerker.werkdagen_regime) || 
                                           !!(medewerker.werkdagen_dagen && medewerker.werkdagen_dagen.length > 0)
                      // Show on days they DON'T work (their free days)
                      return !worksToday && hasWerkregime && day.isCurrentMonth
                    })
                    .map((medewerker) => {
                      const medewerkerName = medewerker.full_name || medewerker.email || 'Onbekend'
                      const werkregimeLabel = formatWerkregimeLabel(medewerker)
                      
                      return (
                        <div
                          key={medewerker.id}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded border truncate',
                            verlofTypeColors.werkregime.bg,
                            verlofTypeColors.werkregime.text,
                            verlofTypeColors.werkregime.border
                          )}
                          title={`${medewerkerName} - Werkregime: ${werkregimeLabel} (vrije dag)`}
                        >
                          {medewerkerName.split(' ')[0]} - {werkregimeLabel}
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-semibold mb-2">Legenda:</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(verlofTypeColors).map(([type, colors]) => {
              const label = type === 'werkregime' ? 'Werkregime' : type.charAt(0).toUpperCase() + type.slice(1)
              return (
                <div
                  key={type}
                  className={cn(
                    'flex items-center gap-2 text-xs px-2 py-1 rounded border',
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  <div className={cn('w-3 h-3 rounded', colors.bg, colors.border, 'border')} />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

