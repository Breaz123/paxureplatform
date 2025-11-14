import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canManageDocuments } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import AfwijkingenBeheer from '@/components/klanten/afwijkingen-beheer'
import type { Klant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function KlantAfwijkingenPage({
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

  if (!canManage) {
    redirect('/klanten')
  }

  const { data: klant, error } = await supabase
    .from('klanten')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !klant) {
    notFound()
  }

  const { data: afwijkingen } = await supabase
    .from('klantflow_afwijkingen')
    .select('*')
    .eq('klant_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Afwijkingen - {klant.naam}</h1>
          <p className="text-muted-foreground">Beheer afwijkingen voor deze klant</p>
        </div>
        <Link href={`/klanten/${id}`}>
          <Button variant="outline">Terug naar Klant</Button>
        </Link>
      </div>

      <AfwijkingenBeheer klantId={id} initialAfwijkingen={afwijkingen || []} />
    </div>
  )
}

