import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch KPI data
  const [pendingTasks, plannedOpleidingen, afwijkingen, notificaties] = await Promise.all([
    supabase
      .from('weekplanning')
      .select('id')
      .is('ingevuld_door', null)
      .then(({ data }) => data?.length || 0),
    supabase
      .from('opleiding_registraties')
      .select('id', { count: 'exact' })
      .then(({ count }) => count || 0),
    supabase
      .from('klantflow_afwijkingen')
      .select('id')
      .eq('opgelost', false)
      .then(({ data }) => data?.length || 0),
    supabase
      .from('notificaties')
      .select('*')
      .eq('user_id', user.id)
      .eq('gelezen', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welkom terug, {user.full_name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Weekplanningen te invullen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Geplande Opleidingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plannedOpleidingen}</div>
            <p className="text-xs text-muted-foreground">
              Totaal geregistreerd
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Afwijkingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{afwijkingen}</div>
            <p className="text-xs text-muted-foreground">
              Vereisen opvolging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notificaties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificaties.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ongelezen berichten
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recente Notificaties</CardTitle>
            <CardDescription>Laatste updates en meldingen</CardDescription>
          </CardHeader>
          <CardContent>
            {notificaties.data && notificaties.data.length > 0 ? (
              <div className="space-y-4">
                {notificaties.data.map((notif) => (
                  <div key={notif.id} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{notif.titel}</p>
                      {notif.bericht && (
                        <p className="text-sm text-muted-foreground">{notif.bericht}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    {notif.type && (
                      <Badge variant="secondary">{notif.type}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen notificaties</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
            <CardDescription>Veelgebruikte functies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/planning/week"
                className="block rounded-md border p-3 hover:bg-gray-50"
              >
                <p className="font-medium">Weekplanning invullen</p>
                <p className="text-sm text-muted-foreground">
                  Plan de komende week
                </p>
              </a>
              <a
                href="/documenten"
                className="block rounded-md border p-3 hover:bg-gray-50"
              >
                <p className="font-medium">Documenten bekijken</p>
                <p className="text-sm text-muted-foreground">
                  Toegang tot alle documenten
                </p>
              </a>
              <a
                href="/opleidingen"
                className="block rounded-md border p-3 hover:bg-gray-50"
              >
                <p className="font-medium">Opleidingen beheren</p>
                <p className="text-sm text-muted-foreground">
                  Registreer opleidingen
                </p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

