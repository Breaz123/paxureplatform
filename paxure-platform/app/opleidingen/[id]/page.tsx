import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import type { Opleiding, ProcesstapType, Profile } from '@/lib/types'

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

export default async function OpleidingDetailsPage({
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

  const { data: opleiding, error } = await supabase
    .from('opleidingen')
    .select('*, profiles!opleidingen_opleider_id_fkey(full_name, email)')
    .eq('id', id)
    .single()

  if (error || !opleiding) {
    notFound()
  }

  // Check if user has completed this opleiding
  const { data: registratie } = user.role === 'maatwerker'
    ? await supabase
        .from('opleiding_registraties')
        .select('*')
        .eq('opleiding_id', id)
        .eq('medewerker_id', user.id)
        .single()
    : { data: null }

  // Get all medewerkers
  const { data: medewerkers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['maatwerker', 'coach', 'hulpcoach'])
    .order('full_name')

  // Get all registraties for this opleiding
  const { data: alleRegistraties } = await supabase
    .from('opleiding_registraties')
    .select('*')
    .eq('opleiding_id', id)
    .order('geregistreerd_op', { ascending: false })

  // Create map of last registration per medewerker
  const laatsteRegistratieMap = new Map<string, any>()
  alleRegistraties?.forEach((reg) => {
    const existing = laatsteRegistratieMap.get(reg.medewerker_id)
    if (!existing || new Date(reg.geregistreerd_op) > new Date(existing.geregistreerd_op)) {
      laatsteRegistratieMap.set(reg.medewerker_id, reg)
    }
  })

  // Find medewerkers who need this opleiding
  const vereisteCapaciteiten = opleiding.capaciteiten_vereist || []
  const medewerkersMetBehoefte: Array<{ medewerker: Profile; prioriteit: 'hoog' | 'gemiddeld' | 'laag'; laatsteRegistratie?: any }> = []

  if (medewerkers && vereisteCapaciteiten.length > 0) {
    medewerkers.forEach((medewerker: Profile) => {
      // Check if medewerker has any required capaciteit in slecht or gemiddeld
      const heeftSlecht = vereisteCapaciteiten.some((cap: string) => 
        medewerker.capaciteiten_slecht?.includes(cap)
      )
      const heeftGemiddeld = vereisteCapaciteiten.some((cap: string) => 
        medewerker.capaciteiten_gemiddeld?.includes(cap)
      )
      
      if (heeftSlecht || heeftGemiddeld) {
        const prioriteit = heeftSlecht ? 'hoog' as const : 'gemiddeld' as const
        medewerkersMetBehoefte.push({
          medewerker,
          prioriteit,
          laatsteRegistratie: laatsteRegistratieMap.get(medewerker.id),
        })
      }
    })
  }

  // Sort by priority (hoog first) and then by last registration date (oldest first)
  medewerkersMetBehoefte.sort((a, b) => {
    if (a.prioriteit !== b.prioriteit) {
      const priorityOrder = { hoog: 0, gemiddeld: 1, laag: 2 }
      return priorityOrder[a.prioriteit] - priorityOrder[b.prioriteit]
    }
    const dateA = a.laatsteRegistratie?.geregistreerd_op ? new Date(a.laatsteRegistratie.geregistreerd_op).getTime() : 0
    const dateB = b.laatsteRegistratie?.geregistreerd_op ? new Date(b.laatsteRegistratie.geregistreerd_op).getTime() : 0
    return dateA - dateB
  })

  const processtapLabel = processtappen.find((s) => s.value === opleiding.processtap)?.label
  const opleider = opleiding.profiles as any

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{opleiding.taak}</h1>
          {opleiding.deeltaak && (
            <p className="text-muted-foreground">{opleiding.deeltaak}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/opleidingen">
            <Button variant="outline">Terug naar Overzicht</Button>
          </Link>
          <a href={`/api/opleidingen/${id}/download`} download>
            <Button variant="outline">Exporteer als PDF</Button>
          </a>
          {canManage && (
            <>
              <Link href={`/opleidingen/${id}/bewerken`}>
                <Button variant="outline">Bewerken</Button>
              </Link>
              <Link href={`/opleidingen/${id}/registreer`}>
                <Button>Registreer</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Algemene Informatie</CardTitle>
                <CardDescription>Basisgegevens van de opleiding</CardDescription>
              </div>
              {opleiding.processtap && (
                <Badge variant="secondary">
                  {processtapLabel}
                </Badge>
              )}
              {registratie && (
                <Badge variant="default">Voltooid</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {opleiding.doel && (
              <div>
                <p className="text-sm font-medium mb-1">Doel:</p>
                <p className="text-sm text-muted-foreground">{opleiding.doel}</p>
              </div>
            )}
            {opleiding.duur && (
              <div>
                <p className="text-sm font-medium mb-1">Duur:</p>
                <p className="text-sm text-muted-foreground">{opleiding.duur}</p>
              </div>
            )}
            {opleider && (
              <div>
                <p className="text-sm font-medium mb-1">Opleider:</p>
                <p className="text-sm text-muted-foreground">
                  {opleider.full_name || opleider.email}
                </p>
              </div>
            )}
            {opleiding.doelgroep && (
              <div>
                <p className="text-sm font-medium mb-1">Doelgroep:</p>
                <p className="text-sm text-muted-foreground">{opleiding.doelgroep}</p>
              </div>
            )}
            {opleiding.voorkennis_vereist && (
              <div>
                <p className="text-sm font-medium mb-1">Voorkennis Vereist:</p>
                <p className="text-sm text-muted-foreground">{opleiding.voorkennis_vereist}</p>
              </div>
            )}
            {opleiding.capaciteiten_vereist && opleiding.capaciteiten_vereist.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Vereiste Capaciteiten:</p>
                <div className="flex flex-wrap gap-1">
                  {opleiding.capaciteiten_vereist.map((cap: string) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {opleiding.opleidingsmethode && opleiding.opleidingsmethode.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Opleidingsmethode</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {opleiding.opleidingsmethode.map((methode: string, idx: number) => (
                  <li key={idx}>{methode}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {opleiding.document_id && (
          <Card>
            <CardContent className="pt-6">
              <Link href={`/api/documents/${opleiding.document_id}/download`}>
                <Button variant="outline">Download Instructiemateriaal</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {registratie && (
          <Card>
            <CardHeader>
              <CardTitle>Mijn Registratie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Voltooid op {new Date(registratie.geregistreerd_op).toLocaleDateString('nl-NL')}
              </p>
            </CardContent>
          </Card>
        )}

        {canManage && vereisteCapaciteiten.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Medewerkers die deze opleiding nodig hebben</CardTitle>
              <CardDescription>
                Automatisch berekend op basis van capaciteiten en vaardigheden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {medewerkersMetBehoefte.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medewerker</TableHead>
                      <TableHead>Prioriteit</TableHead>
                      <TableHead>Laatst Gevolgd</TableHead>
                      <TableHead className="text-right">Actie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medewerkersMetBehoefte.map(({ medewerker, prioriteit, laatsteRegistratie }) => (
                      <TableRow key={medewerker.id}>
                        <TableCell className="font-medium">
                          {medewerker.full_name || medewerker.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={prioriteit === 'hoog' ? 'destructive' : 'secondary'}
                            className={prioriteit === 'gemiddeld' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          >
                            {prioriteit === 'hoog' ? 'Hoog' : prioriteit === 'gemiddeld' ? 'Gemiddeld' : 'Laag'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {laatsteRegistratie ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(laatsteRegistratie.geregistreerd_op).toLocaleDateString('nl-NL')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Nog niet gevolgd</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/opleidingen/${id}/registreer?medewerker=${medewerker.id}`}>
                            <Button variant="outline" size="sm">
                              Registreer
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Alle medewerkers hebben de vereiste vaardigheden al op voldoende niveau, of er zijn geen medewerkers die deze capaciteiten nodig hebben.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {canManage && medewerkers && (
          <Card>
            <CardHeader>
              <CardTitle>Opleidingsgeschiedenis</CardTitle>
              <CardDescription>
                Alle medewerkers en wanneer zij deze opleiding het laatst hebben gevolgd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medewerker</TableHead>
                    <TableHead>Laatst Gevolgd</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medewerkers.map((medewerker: Profile) => {
                    const registratie = laatsteRegistratieMap.get(medewerker.id)
                    return (
                      <TableRow key={medewerker.id}>
                        <TableCell className="font-medium">
                          {medewerker.full_name || medewerker.email}
                        </TableCell>
                        <TableCell>
                          {registratie ? (
                            <span className="text-sm">
                              {new Date(registratie.geregistreerd_op).toLocaleDateString('nl-NL')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Nog niet gevolgd</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {registratie ? (
                            <Badge variant="default">Voltooid</Badge>
                          ) : (
                            <Badge variant="outline">Niet voltooid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/opleidingen/${id}/registreer?medewerker=${medewerker.id}`}>
                            <Button variant="outline" size="sm">
                              {registratie ? 'Hernoemen' : 'Registreer'}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

