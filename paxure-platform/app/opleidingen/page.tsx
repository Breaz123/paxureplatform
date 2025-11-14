import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { ProcesstapType } from '@/lib/types'

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

export default async function OpleidingenPage({
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
  const canManage = canEdit(user.role)

  let query = supabase
    .from('opleidingen')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.processtap) {
    query = query.eq('processtap', params.processtap)
  }

  const { data: opleidingen } = await query

  // Get registraties for current user if they're a maatwerker
  const { data: registraties } = user.role === 'maatwerker'
    ? await supabase
        .from('opleiding_registraties')
        .select('*, opleidingen(*)')
        .eq('medewerker_id', user.id)
    : { data: null }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opleidingen</h1>
          <p className="text-muted-foreground">
            Overzicht van alle beschikbare opleidingen per processtap
          </p>
        </div>
        {canManage && (
          <Link href="/opleidingen/nieuw">
            <Button>Nieuwe Opleiding</Button>
          </Link>
        )}
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <Link href="/opleidingen">
          <Button variant={!params.processtap ? 'default' : 'outline'}>
            Alle
          </Button>
        </Link>
        {processtappen.map((stap) => (
          <Link key={stap.value} href={`/opleidingen?processtap=${stap.value}`}>
            <Button variant={params.processtap === stap.value ? 'default' : 'outline'}>
              {stap.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opleidingen && opleidingen.length > 0 ? (
          opleidingen.map((opleiding: any) => {
            const isVoltooid = registraties?.some(
              (r: any) => r.opleiding_id === opleiding.id
            )
            
            return (
              <Card key={opleiding.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{opleiding.taak}</CardTitle>
                    {opleiding.processtap && (
                      <Badge variant="secondary">
                        {processtappen.find((s) => s.value === opleiding.processtap)?.label}
                      </Badge>
                    )}
                  </div>
                  {opleiding.deeltaak && (
                    <CardDescription>{opleiding.deeltaak}</CardDescription>
                  )}
                  {opleiding.capaciteiten_vereist && opleiding.capaciteiten_vereist.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opleiding.capaciteiten_vereist.map((cap: string) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {opleiding.doel && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {opleiding.doel}
                      </p>
                    )}
                    {isVoltooid && (
                      <Badge variant="default" className="mt-2">
                        Voltooid
                      </Badge>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/opleidingen/${opleiding.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Bekijk Details
                        </Button>
                      </Link>
                      {canManage && (
                        <Link href={`/opleidingen/${opleiding.id}/registreer`}>
                          <Button variant="outline">
                          Registreer
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Geen opleidingen gevonden</p>
          </div>
        )}
      </div>
    </div>
  )
}

