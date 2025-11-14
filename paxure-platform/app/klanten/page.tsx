import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManageDocuments } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Klant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function KlantenPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const canManage = canManageDocuments(user.role)

  const { data: klanten } = await supabase
    .from('klanten')
    .select('*, profiles!klanten_interne_verantwoordelijke_fkey(full_name)')
    .order('naam')

  // Get open afwijkingen per klant
  const { data: afwijkingen } = await supabase
    .from('klantflow_afwijkingen')
    .select('klant_id')
    .eq('opgelost', false)

  const afwijkingenMap = new Map<string, number>()
  afwijkingen?.forEach((afw) => {
    const count = afwijkingenMap.get(afw.klant_id) || 0
    afwijkingenMap.set(afw.klant_id, count + 1)
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Klanten & Flows</h1>
          <p className="text-muted-foreground">
            Overzicht van alle klanten en hun specifieke flows
          </p>
        </div>
        {canManage && (
          <Link href="/klanten/nieuw">
            <Button>Nieuwe Klant</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {klanten && klanten.length > 0 ? (
          klanten.map((klant: any) => {
            const openAfwijkingen = afwijkingenMap.get(klant.id) || 0
            return (
              <Card key={klant.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{klant.naam}</CardTitle>
                    {openAfwijkingen > 0 && (
                      <Badge variant="destructive">{openAfwijkingen} afwijkingen</Badge>
                    )}
                  </div>
                  {klant.profiles && (
                    <CardDescription>
                      Verantwoordelijke: {klant.profiles.full_name || 'Onbekend'}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {klant.contactpersoon_naam && (
                      <p className="text-sm">
                        <span className="font-medium">Contact:</span> {klant.contactpersoon_naam}
                      </p>
                    )}
                    {klant.contactpersoon_email && (
                      <p className="text-sm text-muted-foreground">
                        {klant.contactpersoon_email}
                      </p>
                    )}
                    {klant.productoverzicht && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {klant.productoverzicht}
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/klanten/${klant.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Bekijk Details
                        </Button>
                      </Link>
                      {openAfwijkingen > 0 && (
                        <Link href={`/klanten/${klant.id}/afwijkingen`}>
                          <Button variant="destructive">
                            Afwijkingen
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
            <p className="text-muted-foreground">Geen klanten gevonden</p>
          </div>
        )}
      </div>
    </div>
  )
}

