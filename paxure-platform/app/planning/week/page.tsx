import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { getWeekDates } from '@/lib/utils/date'
import WeekplanningForm from '@/components/planning/weekplanning-form'

export const dynamic = 'force-dynamic'

export default async function WeekplanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const canEdit = canManagePlanning(user.role)

  const supabase = await createClient()
  
  // Get current week or specified week
  const weekStart = params.week 
    ? new Date(params.week)
    : getWeekDates(new Date()).monday

  const weekEnd = getWeekDates(weekStart).friday

  // Check if planning exists
  const { data: existingPlanning } = await supabase
    .from('weekplanning')
    .select('*')
    .eq('week_start', weekStart.toISOString().split('T')[0])
    .single()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Weekplanning</h1>
        <p className="text-muted-foreground">
          Plan de week van {weekStart.toLocaleDateString('nl-NL')} tot {weekEnd.toLocaleDateString('nl-NL')}
        </p>
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
            <p className="text-muted-foreground">
              Je hebt geen rechten om de planning te bewerken.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

