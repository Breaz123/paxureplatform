import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import type { Profile, Opleiding } from '@/lib/types'

export const dynamic = 'force-dynamic'

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  business_developer: 'Business Developer',
  operationeel_verantwoordelijke: 'Operationeel Verantwoordelijke',
  administratief_bediende: 'Administratief Bediende',
  coach: 'Coach',
  hulpcoach: 'Hulpcoach',
  maatwerker: 'Maatwerker',
}

export default async function MedewerkerDetailsPage({
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
  const canManage = canManagePlanning(user.role)

  // Load medewerker
  const { data: medewerker, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !medewerker) {
    notFound()
  }

  // Get all registraties for this medewerker, grouped by capaciteit
  const { data: registraties } = await supabase
    .from('opleiding_registraties')
    .select(`
      *,
      opleidingen!inner (
        id,
        taak,
        capaciteiten_vereist
      )
    `)
    .eq('medewerker_id', id)
    .order('geregistreerd_op', { ascending: false })

  // Group registraties by capaciteit and find most recent for each
  const capaciteitMap = new Map<string, { opleiding: Opleiding; datum: Date }>()
  
  registraties?.forEach((reg: any) => {
    const opleiding = reg.opleidingen as Opleiding
    const capaciteiten = opleiding.capaciteiten_vereist || []
    
    capaciteiten.forEach((cap) => {
      const existing = capaciteitMap.get(cap)
      const datum = new Date(reg.geregistreerd_op)
      
      if (!existing || datum > existing.datum) {
        capaciteitMap.set(cap, { opleiding, datum })
      }
    })
  })

  // Get all capaciteiten from medewerker
  const alleCapaciteiten = [
    ...(medewerker.capaciteiten_goed || []),
    ...(medewerker.capaciteiten_gemiddeld || []),
    ...(medewerker.capaciteiten_slecht || []),
  ]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{medewerker.full_name || 'Medewerker'}</h1>
          <p className="text-muted-foreground">{medewerker.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/medewerkers">
            <Button variant="outline">Terug naar Overzicht</Button>
          </Link>
          {canManage && (
            <Link href={`/medewerkers/${id}/bewerken`}>
              <Button>Bewerken</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Algemene Informatie */}
        <Card>
          <CardHeader>
            <CardTitle>Algemene Informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Rol</p>
              <Badge variant="outline">
                {roleLabels[medewerker.role] || medewerker.role}
              </Badge>
            </div>
            {medewerker.werkdagen_per_week && medewerker.werkdagen_per_week !== 5 && (
              <div>
                <p className="text-sm font-medium mb-1">Werkdagen per Week</p>
                <Badge variant="secondary">
                  {medewerker.werkdagen_per_week}/5
                </Badge>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-2">Capaciteiten</p>
              <div className="space-y-2">
                {medewerker.capaciteiten_goed && medewerker.capaciteiten_goed.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Goed:</p>
                    <div className="flex flex-wrap gap-1">
                      {medewerker.capaciteiten_goed.map((cap) => (
                        <Badge key={cap} variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                          {cap} ✓
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {medewerker.capaciteiten_gemiddeld && medewerker.capaciteiten_gemiddeld.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Gemiddeld:</p>
                    <div className="flex flex-wrap gap-1">
                      {medewerker.capaciteiten_gemiddeld.map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs bg-yellow-600 hover:bg-yellow-700">
                          {cap} ~
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {medewerker.capaciteiten_slecht && medewerker.capaciteiten_slecht.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Training nodig:</p>
                    <div className="flex flex-wrap gap-1">
                      {medewerker.capaciteiten_slecht.map((cap) => (
                        <Badge key={cap} variant="destructive" className="text-xs">
                          {cap} ✗
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opleidingsgeschiedenis per Capaciteit */}
        {alleCapaciteiten.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Laatste Opleiding per Capaciteit</CardTitle>
              <CardDescription>
                Wanneer heeft deze medewerker het laatst een opleiding gevolgd voor elke capaciteit?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capaciteit</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Laatste Opleiding</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alleCapaciteiten.map((cap) => {
                    const laatste = capaciteitMap.get(cap)
                    const isGoed = medewerker.capaciteiten_goed?.includes(cap)
                    const isGemiddeld = medewerker.capaciteiten_gemiddeld?.includes(cap)
                    const isSlecht = medewerker.capaciteiten_slecht?.includes(cap)
                    
                    let niveau = 'Onbekend'
                    let niveauVariant: 'default' | 'secondary' | 'destructive' = 'default'
                    if (isGoed) {
                      niveau = 'Goed'
                      niveauVariant = 'default'
                    } else if (isGemiddeld) {
                      niveau = 'Gemiddeld'
                      niveauVariant = 'secondary'
                    } else if (isSlecht) {
                      niveau = 'Training nodig'
                      niveauVariant = 'destructive'
                    }

                    return (
                      <TableRow key={cap}>
                        <TableCell className="font-medium">{cap}</TableCell>
                        <TableCell>
                          <Badge
                            variant={niveauVariant}
                            className={
                              niveau === 'Gemiddeld' ? 'bg-yellow-600 hover:bg-yellow-700' :
                              niveau === 'Goed' ? 'bg-green-600 hover:bg-green-700' : ''
                            }
                          >
                            {niveau}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {laatste ? (
                            <Link href={`/opleidingen/${laatste.opleiding.id}`} className="text-primary hover:underline">
                              {laatste.opleiding.taak}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Geen opleiding gevolgd</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {laatste ? (
                            <span className="text-sm text-muted-foreground">
                              {laatste.datum.toLocaleDateString('nl-NL')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage && (
                            <Link href={`/opleidingen?filter=${cap}`}>
                              <Button variant="outline" size="sm">
                                Zoek Opleiding
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Alle Opleidingen */}
        {registraties && registraties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Alle Gevolgde Opleidingen</CardTitle>
              <CardDescription>
                Complete geschiedenis van gevolgde opleidingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opleiding</TableHead>
                    <TableHead>Capaciteiten</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registraties.map((reg: any) => {
                    const opleiding = reg.opleidingen as Opleiding
                    return (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{opleiding.taak}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(opleiding.capaciteiten_vereist || []).map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(reg.geregistreerd_op).toLocaleDateString('nl-NL')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/opleidingen/${opleiding.id}`}>
                            <Button variant="outline" size="sm">
                              Bekijk
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

