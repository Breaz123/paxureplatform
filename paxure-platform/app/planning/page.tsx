import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getWeekDates } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get current week
  const { monday, friday } = getWeekDates(new Date())

  // Get current week planning
  const { data: weekplanning } = await supabase
    .from('weekplanning')
    .select('*')
    .eq('week_start', monday.toISOString().split('T')[0])
    .single()

  // Get current month planning
  const now = new Date()
  const { data: maandplanning } = await supabase
    .from('maandplanning')
    .select('*')
    .eq('maand', now.getMonth() + 1)
    .eq('jaar', now.getFullYear())
    .single()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Planning</h1>
        <p className="text-muted-foreground">
          Week- en maandplanning beheer
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekplanning</CardTitle>
            <CardDescription>
              Plan de week van {monday.toLocaleDateString('nl-NL')} tot {friday.toLocaleDateString('nl-NL')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weekplanning ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ingevuld op {new Date(weekplanning.ingevuld_op).toLocaleDateString('nl-NL')}
                  </p>
                  <Link href="/planning/week">
                    <Button className="w-full">Bekijk/Bewerk Weekplanning</Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nog geen planning voor deze week
                  </p>
                  <Link href="/planning/week">
                    <Button className="w-full">Weekplanning Invullen</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maandplanning</CardTitle>
            <CardDescription>
              Overzicht voor {now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maandplanning ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Laatste update: {new Date(maandplanning.updated_at).toLocaleDateString('nl-NL')}
                  </p>
                  <Link href="/planning/maand">
                    <Button className="w-full">Bekijk/Bewerk Maandplanning</Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nog geen planning voor deze maand
                  </p>
                  <Link href="/planning/maand">
                    <Button className="w-full">Maandplanning Aanmaken</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

