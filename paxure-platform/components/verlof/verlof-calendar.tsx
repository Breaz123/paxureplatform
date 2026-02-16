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

const dagNamen = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

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

  // Get verlof for a specific date
  const getVerlofForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return verlofEntries.filter(
      (verlof) =>
        verlof.start_datum <= dateStr && verlof.eind_datum >= dateStr
    )
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
          <CardTitle>Verlof Kalender</CardTitle>
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
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dagNamen.map((dag) => (
            <div
              key={dag}
              className="p-2 text-center text-sm font-semibold text-muted-foreground"
            >
              {dag}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
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
                  {Object.entries(verlofForDay).map(([medewerkerId, verlofList]) => {
                    const medewerker = medewerkers.find((m) => m.id === medewerkerId)
                    const medewerkerName = medewerker?.full_name || medewerker?.email || 'Onbekend'
                    
                    return verlofList.map((verlof) => {
                      const colors = verlofTypeColors[verlof.type] || verlofTypeColors.andere
                      return (
                        <div
                          key={verlof.id}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded border truncate',
                            colors.bg,
                            colors.text,
                            colors.border
                          )}
                          title={`${medewerkerName} - ${verlof.type}${verlof.opmerking ? `: ${verlof.opmerking}` : ''}`}
                        >
                          {medewerkerName.split(' ')[0]} - {verlof.type}
                        </div>
                      )
                    })
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
            {Object.entries(verlofTypeColors).map(([type, colors]) => (
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
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

