import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Vaardighedenmatrix, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

const vaardigheden = [
  { key: 'orderpicken', label: 'Orderpicken' },
  { key: 'inpakken', label: 'Inpakken' },
  { key: 'controle', label: 'Controle' },
  { key: 'reachtruck', label: 'Reachtruck' },
  { key: 'vas', label: 'VAS' },
  { key: 'wingparentflow', label: 'Wingparentflow' },
] as const

const scoreLabels: Record<string, string> = {
  '0': 'Niet opgeleid',
  '1': 'Onder begeleiding',
  '2': 'Zelfstandig',
  'ja': 'Ja',
  'nee': 'Nee',
}

const scoreColors: Record<string, string> = {
  '0': 'bg-red-100 text-red-800',
  '1': 'bg-yellow-100 text-yellow-800',
  '2': 'bg-green-100 text-green-800',
  'ja': 'bg-green-100 text-green-800',
  'nee': 'bg-gray-100 text-gray-800',
}

export default async function VaardighedenmatrixPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const canManage = canEdit(user.role)

  // Get all profiles (medewerkers)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  // Get all vaardighedenmatrix entries
  const { data: matrixEntries } = await supabase
    .from('vaardighedenmatrix')
    .select('*')
    .eq('status', 'actief')

  // Create a map for quick lookup
  const matrixMap = new Map(
    matrixEntries?.map((entry) => [entry.medewerker_id, entry]) || []
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vaardighedenmatrix</h1>
          <p className="text-muted-foreground">
            Overzicht van inzetbaarheid per medewerker en taak
          </p>
        </div>
        {canManage && (
          <Link href="/vaardighedenmatrix/bewerken">
            <Button>Matrix Bewerken</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overzicht Medewerkers</CardTitle>
          <CardDescription>
            Legenda: 0 = Niet opgeleid, 1 = Onder begeleiding, 2 = Zelfstandig
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medewerker</TableHead>
                  {vaardigheden.map((v) => (
                    <TableHead key={v.key} className="text-center">
                      {v.label}
                    </TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead>Opmerkingen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles && profiles.length > 0 ? (
                  profiles.map((profile: Profile) => {
                    const entry = matrixMap.get(profile.id)
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name || profile.email}
                        </TableCell>
                        {vaardigheden.map((v) => {
                          const score = entry?.[v.key as keyof Vaardighedenmatrix] as string | null
                          return (
                            <TableCell key={v.key} className="text-center">
                              {score ? (
                                <Badge
                                  className={scoreColors[score] || 'bg-gray-100 text-gray-800'}
                                >
                                  {scoreLabels[score] || score}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell>
                          <Badge variant="outline">{entry?.status || 'Onbekend'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry?.opmerkingen || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Geen medewerkers gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

