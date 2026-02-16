import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { getWeekDates, getWeekNumber, getDateFromWeekYear, getWeeksInYear } from '@/lib/utils/date'
import WeekplanningForm from '@/components/planning/weekplanning-form'
import WeekYearSelector from '@/components/planning/week-year-selector'

export const dynamic = 'force-dynamic'

export default async function WeekplanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; year?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const canEdit = canManagePlanning(user.role)

  const supabase = await createClient()
  
  // Get current week or specified week/year
  let weekStart: Date
  if (params.week && params.year) {
    const week = parseInt(params.week)
    const year = parseInt(params.year)
    weekStart = getDateFromWeekYear(week, year)
  } else if (params.week) {
    weekStart = new Date(params.week)
  } else {
    weekStart = getWeekDates(new Date()).monday
  }

  const weekEnd = getWeekDates(weekStart).friday
  const currentWeek = getWeekNumber(weekStart)
  const currentYear = weekStart.getFullYear()

  // Check if planning exists
  const { data: existingPlanning } = await supabase
    .from('weekplanning')
    .select('*')
    .eq('week_start', weekStart.toISOString().split('T')[0])
    .single()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Weekplanning</h1>
            <p className="text-muted-foreground">
              Plan de week van {weekStart.toLocaleDateString('nl-NL')} tot {weekEnd.toLocaleDateString('nl-NL')}
            </p>
          </div>
          <WeekYearSelector 
            currentWeek={currentWeek} 
            currentYear={currentYear}
            basePath="/planning/week"
          />
        </div>
      </div>

      {canEdit ? (
        <WeekplanningForm 
          initialData={existingPlanning || null}
          weekStart={weekStart}
          weekEnd={weekEnd}
          userId={user.id}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-2">
              Je hebt geen rechten om de planning te bewerken.
            </p>
            <p className="text-sm text-muted-foreground">
              Je huidige rol: <span className="font-semibold">{user.role || 'geen rol'}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Om de planning te bewerken heb je een van deze rollen nodig: admin, coach, hulpcoach, operationeel_verantwoordelijke, of business_developer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

