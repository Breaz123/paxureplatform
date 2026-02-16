import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

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

export default async function MedewerkersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const canManage = canManagePlanning(user.role)

  const { data: medewerkers } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medewerkers</h1>
          <p className="text-muted-foreground">
            Beheer alle medewerkers, rollen en capaciteiten
          </p>
        </div>
        {canManage && (
          <Link href="/medewerkers/nieuw">
            <Button>Nieuwe Medewerker</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overzicht Medewerkers</CardTitle>
          <CardDescription>
            {medewerkers?.length || 0} medewerker(s) in totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Capaciteiten</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medewerkers && medewerkers.length > 0 ? (
                medewerkers.map((medewerker: Profile) => (
                  <TableRow key={medewerker.id}>
                    <TableCell className="font-medium">
                      {medewerker.full_name || 'Geen naam'}
                    </TableCell>
                    <TableCell>{medewerker.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[medewerker.role] || medewerker.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {medewerker.capaciteiten_goed && medewerker.capaciteiten_goed.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {medewerker.capaciteiten_goed.map((cap) => (
                              <Badge key={cap} variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                                {cap} ✓
                              </Badge>
                            ))}
                          </div>
                        )}
                        {medewerker.capaciteiten_gemiddeld && medewerker.capaciteiten_gemiddeld.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {medewerker.capaciteiten_gemiddeld.map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-xs bg-yellow-600 hover:bg-yellow-700">
                                {cap} ~
                              </Badge>
                            ))}
                          </div>
                        )}
                        {medewerker.capaciteiten_slecht && medewerker.capaciteiten_slecht.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {medewerker.capaciteiten_slecht.map((cap) => (
                              <Badge key={cap} variant="destructive" className="text-xs">
                                {cap} ✗
                              </Badge>
                            ))}
                          </div>
                        )}
                        {(!medewerker.capaciteiten_goed || medewerker.capaciteiten_goed.length === 0) &&
                         (!medewerker.capaciteiten_gemiddeld || medewerker.capaciteiten_gemiddeld.length === 0) &&
                         (!medewerker.capaciteiten_slecht || medewerker.capaciteiten_slecht.length === 0) && (
                          <span className="text-sm text-muted-foreground">Geen capaciteiten</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/medewerkers/${medewerker.id}`}>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </Link>
                        {canManage && (
                          <Link href={`/medewerkers/${medewerker.id}/bewerken`}>
                            <Button variant="outline" size="sm">
                              Bewerken
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Geen medewerkers gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

