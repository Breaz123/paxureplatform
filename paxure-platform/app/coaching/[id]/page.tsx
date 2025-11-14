import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import EvaluatieEditForm from '@/components/coaching/evaluatie-edit-form'
import type { Evaluatie, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EvaluatieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const supabase = await createClient()
  const canManage = canEdit(user.role)

  // Get evaluatie with related profiles
  const { data: evaluatie, error } = await supabase
    .from('evaluaties')
    .select('*, medewerker:profiles!evaluaties_medewerker_id_fkey(full_name, email), coach:profiles!evaluaties_coach_id_fkey(full_name)')
    .eq('id', id)
    .single()

  if (error || !evaluatie) {
    notFound()
  }

  // Check permissions
  if (user.role === 'maatwerker' && evaluatie.medewerker_id !== user.id) {
    redirect('/coaching')
  }

  if (!canManage && user.id !== evaluatie.coach_id) {
    redirect('/coaching')
  }

  const medewerker = (evaluatie as any).medewerker as Profile | null
  const coach = (evaluatie as any).coach as Profile | null

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evaluatie Details</h1>
          <p className="text-muted-foreground">
            {user.role === 'maatwerker'
              ? `Evaluatie met ${(evaluatie as any).coach?.full_name || 'Coach'}`
              : `Evaluatie: ${(evaluatie as any).medewerker?.full_name || (evaluatie as any).medewerker?.email || 'Medewerker'}`}
          </p>
        </div>
        <Link href="/coaching">
          <Button variant="outline">Terug naar Overzicht</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>
                {evaluatie.evaluatie_type || 'Evaluatie'}
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
        <CardContent className="space-y-6">
          {evaluatie.notities && (
            <div>
              <p className="text-sm font-medium mb-2">Notities:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {evaluatie.notities}
              </p>
            </div>
          )}

          {evaluatie.actiepunten && evaluatie.actiepunten.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Actiepunten:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {evaluatie.actiepunten.map((punt: string, idx: number) => (
                  <li key={idx}>{punt}</li>
                ))}
              </ul>
            </div>
          )}

          {evaluatie.volgende_afspraak && (
            <div>
              <p className="text-sm font-medium mb-1">Volgende afspraak:</p>
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
        </CardContent>
      </Card>

      {canManage && (
        <EvaluatieEditForm evaluatie={evaluatie as Evaluatie} />
      )}
    </div>
  )
}

