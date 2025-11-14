import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canManageDocuments } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { SOP, ProcesstapType } from '@/lib/types'

export const dynamic = 'force-dynamic'

const processtappen: { value: ProcesstapType; label: string }[] = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'picking', label: 'Picking' },
  { value: 'packing', label: 'Packing' },
  { value: 'controle', label: 'Controle' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'vas', label: 'VAS' },
  { value: 'afwijkingen', label: 'Afwijkingen' },
]

export default async function SOPDetailsPage({
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
  const canManage = canManageDocuments(user.role)

  const { data: sop, error } = await supabase
    .from('sops')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !sop) {
    notFound()
  }

  const processtapLabel = processtappen.find((s) => s.value === sop.processtap)?.label

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{sop.title}</h1>
          <p className="text-muted-foreground">
            Standaard Werkprocedure {sop.processtap && `- ${processtapLabel}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sops">
            <Button variant="outline">Terug naar Overzicht</Button>
          </Link>
          {canManage && (
            <Link href={`/sops/${id}/bewerken`}>
              <Button variant="outline">Bewerken</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Algemene Informatie</CardTitle>
                <CardDescription>Basisgegevens van de SOP</CardDescription>
              </div>
              <div className="flex gap-2">
                {sop.processtap && (
                  <Badge variant="secondary">
                    {processtapLabel}
                  </Badge>
                )}
                {sop.goedgekeurd_door && (
                  <Badge variant="outline">Goedgekeurd</Badge>
                )}
                {sop.training_vereist && (
                  <Badge variant="default">Training Vereist</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Versie:</p>
              <p className="text-sm text-muted-foreground">Versie {sop.versie}</p>
            </div>
            {sop.doel && (
              <div>
                <p className="text-sm font-medium mb-1">Doel:</p>
                <p className="text-sm text-muted-foreground">{sop.doel}</p>
              </div>
            )}
            {sop.toepassingsgebied && (
              <div>
                <p className="text-sm font-medium mb-1">Toepassingsgebied:</p>
                <p className="text-sm text-muted-foreground">{sop.toepassingsgebied}</p>
              </div>
            )}
            {sop.volgende_herziening && (
              <div>
                <p className="text-sm font-medium mb-1">Volgende Herziening:</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(sop.volgende_herziening).toLocaleDateString('nl-NL')}
                </p>
              </div>
            )}
            {sop.goedgekeurd_op && (
              <div>
                <p className="text-sm font-medium mb-1">Goedgekeurd op:</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(sop.goedgekeurd_op).toLocaleDateString('nl-NL')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {sop.materiaal_vereist && sop.materiaal_vereist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Materiaal Vereist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {sop.materiaal_vereist.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {sop.stap_voor_stap && (
          <Card>
            <CardHeader>
              <CardTitle>Stap voor Stap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sop.stap_voor_stap}
              </div>
            </CardContent>
          </Card>
        )}

        {sop.kwaliteitscontrole && (
          <Card>
            <CardHeader>
              <CardTitle>Kwaliteitscontrole</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sop.kwaliteitscontrole}
              </div>
            </CardContent>
          </Card>
        )}

        {sop.afwijkingen_handling && (
          <Card>
            <CardHeader>
              <CardTitle>Afwijkingen Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sop.afwijkingen_handling}
              </div>
            </CardContent>
          </Card>
        )}

        {sop.veiligheidsinstructies && (
          <Card>
            <CardHeader>
              <CardTitle>Veiligheidsinstructies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sop.veiligheidsinstructies}
              </div>
            </CardContent>
          </Card>
        )}

        {sop.document_id && (
          <Card>
            <CardContent className="pt-6">
              <Link href={`/api/documents/${sop.document_id}/download`}>
                <Button variant="outline">Download Document</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

