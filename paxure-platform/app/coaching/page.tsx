import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Evaluatie, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CoachingPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const canManage = canEdit(user.role)

  // If user is a maatwerker, show only their evaluations
  // Otherwise, show all evaluations where user is the coach
  let query = supabase
    .from('evaluaties')
    .select('*, medewerker:profiles!evaluaties_medewerker_id_fkey(full_name, email), coach:profiles!evaluaties_coach_id_fkey(full_name)')
    .order('datum', { ascending: false })

  if (user.role === 'maatwerker') {
    query = query.eq('medewerker_id', user.id)
  } else if (canManage) {
    query = query.eq('coach_id', user.id)
  } else {
    // No access
    query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Return nothing
  }

  const { data: evaluaties } = await query

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coaching & Evaluaties</h1>
          <p className="text-muted-foreground">
            {user.role === 'maatwerker' 
              ? 'Mijn evaluaties en coaching gesprekken'
              : 'Beheer evaluaties en coaching gesprekken'}
          </p>
        </div>
        {canManage && (
          <Link href="/coaching/nieuw">
            <Button>Nieuwe Evaluatie</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {evaluaties && evaluaties.length > 0 ? (
          evaluaties.map((evaluatie: any) => (
            <Card key={evaluatie.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      {user.role === 'maatwerker' 
                        ? `Evaluatie met ${(evaluatie as any).coach?.full_name || 'Coach'}`
                        : `Evaluatie: ${(evaluatie as any).medewerker?.full_name || (evaluatie as any).medewerker?.email || 'Medewerker'}`}
                    </CardTitle>
                    <CardDescription>
                      {new Date(evaluatie.datum).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  {evaluatie.evaluatie_type && (
                    <Badge variant="secondary">{evaluatie.evaluatie_type}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluatie.notities && (
                    <div>
                      <p className="text-sm font-medium mb-1">Notities:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {evaluatie.notities}
                      </p>
                    </div>
                  )}
                  {evaluatie.actiepunten && evaluatie.actiepunten.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Actiepunten:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {evaluatie.actiepunten.map((punt: string, idx: number) => (
                          <li key={idx}>{punt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluatie.volgende_afspraak && (
                    <div>
                      <p className="text-sm font-medium">Volgende afspraak:</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evaluatie.volgende_afspraak).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  )}
                  {evaluatie.rapport_path && (
                    <div>
                      <a
                        href={`/api/evaluaties/${evaluatie.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">Download Rapport</Button>
                      </a>
                    </div>
                  )}
                  <Link href={`/coaching/${evaluatie.id}`}>
                    <Button variant="outline">Bekijk Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Geen evaluaties gevonden
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

