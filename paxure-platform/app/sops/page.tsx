import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

export default async function SOPsPage({
  searchParams,
}: {
  searchParams: Promise<{ processtap?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const supabase = await createClient()
  const canManage = canManageDocuments(user.role)

  let query = supabase
    .from('sops')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.processtap) {
    query = query.eq('processtap', params.processtap)
  }

  const { data: sops } = await query

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOP Beheer</h1>
          <p className="text-muted-foreground">
            Standaard Werkprocedures met versiebeheer
          </p>
        </div>
        {canManage && (
          <Link href="/sops/nieuw">
            <Button>Nieuwe SOP</Button>
          </Link>
        )}
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <Link href="/sops">
          <Button variant={!params.processtap ? 'default' : 'outline'}>
            Alle
          </Button>
        </Link>
        {processtappen.map((stap) => (
          <Link key={stap.value} href={`/sops?processtap=${stap.value}`}>
            <Button variant={params.processtap === stap.value ? 'default' : 'outline'}>
              {stap.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sops && sops.length > 0 ? (
          sops.map((sop: SOP) => (
            <Card key={sop.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{sop.title}</CardTitle>
                  {sop.processtap && (
                    <Badge variant="secondary">
                      {processtappen.find((s) => s.value === sop.processtap)?.label}
                    </Badge>
                  )}
                </div>
                {sop.doel && (
                  <CardDescription className="line-clamp-2">
                    {sop.doel}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Versie {sop.versie}</span>
                    {sop.goedgekeurd_door && (
                      <Badge variant="outline" className="text-xs">
                        Goedgekeurd
                      </Badge>
                    )}
                  </div>
                  {sop.volgende_herziening && (
                    <p className="text-xs text-muted-foreground">
                      Herziening: {new Date(sop.volgende_herziening).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                  <Link href={`/sops/${sop.id}`} className="block mt-4">
                    <Button variant="outline" className="w-full">
                      Bekijk SOP
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Geen SOP's gevonden</p>
          </div>
        )}
      </div>
    </div>
  )
}

