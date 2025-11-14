import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canManageDocuments } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Klant, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function KlantDetailsPage({
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

  const { data: klant, error } = await supabase
    .from('klanten')
    .select('*, profiles!klanten_interne_verantwoordelijke_fkey(full_name, email)')
    .eq('id', id)
    .single()

  if (error || !klant) {
    notFound()
  }

  // Get open afwijkingen
  const { data: afwijkingen } = await supabase
    .from('klantflow_afwijkingen')
    .select('*')
    .eq('klant_id', id)
    .eq('opgelost', false)
    .order('created_at', { ascending: false })

  const verantwoordelijke = klant.profiles as Profile | null

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{klant.naam}</h1>
          <p className="text-muted-foreground">Klantdraaiboek en Flow</p>
        </div>
        <div className="flex gap-2">
          <Link href="/klanten">
            <Button variant="outline">Terug naar Overzicht</Button>
          </Link>
          {canManage && (
            <Link href={`/klanten/${id}/bewerken`}>
              <Button variant="outline">Bewerken</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contactgegevens</CardTitle>
            <CardDescription>Klant en contactpersonen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {klant.contactpersoon_naam && (
              <div>
                <p className="text-sm font-medium mb-1">Contactpersoon:</p>
                <p className="text-sm text-muted-foreground">{klant.contactpersoon_naam}</p>
                {klant.contactpersoon_email && (
                  <p className="text-sm text-muted-foreground">{klant.contactpersoon_email}</p>
                )}
                {klant.contactpersoon_telefoon && (
                  <p className="text-sm text-muted-foreground">{klant.contactpersoon_telefoon}</p>
                )}
              </div>
            )}
            {verantwoordelijke && (
              <div>
                <p className="text-sm font-medium mb-1">Interne Verantwoordelijke:</p>
                <p className="text-sm text-muted-foreground">
                  {verantwoordelijke.full_name || verantwoordelijke.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {klant.productoverzicht && (
          <Card>
            <CardHeader>
              <CardTitle>Productoverzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {klant.productoverzicht}
              </div>
            </CardContent>
          </Card>
        )}

        {klant.orderflow_beschrijving && (
          <Card>
            <CardHeader>
              <CardTitle>Orderflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {klant.orderflow_beschrijving}
              </div>
            </CardContent>
          </Card>
        )}

        {klant.verpakking_vereisten && (
          <Card>
            <CardHeader>
              <CardTitle>Verpakking Vereisten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {klant.verpakking_vereisten}
              </div>
            </CardContent>
          </Card>
        )}

        {klant.transport_afspraken && (
          <Card>
            <CardHeader>
              <CardTitle>Transport Afspraken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {klant.transport_afspraken}
              </div>
            </CardContent>
          </Card>
        )}

        {klant.afwijkingen && (
          <Card>
            <CardHeader>
              <CardTitle>Afwijkingen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {klant.afwijkingen}
              </div>
            </CardContent>
          </Card>
        )}

        {klant.seizoensinvloed && (
          <Card>
            <CardHeader>
              <CardTitle>Seizoensinvloed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {klant.seizoensinvloed}
              </div>
            </CardContent>
          </Card>
        )}

        {afwijkingen && afwijkingen.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Open Afwijkingen</CardTitle>
                  <CardDescription>Afwijkingen die opvolging vereisen</CardDescription>
                </div>
                <Badge variant="destructive">{afwijkingen.length} open</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {afwijkingen.map((afwijking: any) => (
                  <div key={afwijking.id} className="border-l-4 border-destructive pl-4 py-2">
                    <p className="text-sm font-medium">{afwijking.titel}</p>
                    {afwijking.beschrijving && (
                      <p className="text-sm text-muted-foreground mt-1">{afwijking.beschrijving}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(afwijking.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                ))}
                <Link href={`/klanten/${id}/afwijkingen`}>
                  <Button variant="outline" className="w-full mt-4">
                    Bekijk Alle Afwijkingen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {canManage && (
          <Card>
            <CardContent className="pt-6">
              <Link href={`/klanten/${id}/afwijkingen`}>
                <Button variant="outline">Afwijkingen Beheren</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

