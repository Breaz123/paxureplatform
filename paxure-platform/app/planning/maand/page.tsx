import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import MaandplanningForm from '@/components/planning/maandplanning-form'
import MaandSelector from '@/components/planning/maand-selector'

export const dynamic = 'force-dynamic'

export default async function MaandplanningPage({
  searchParams,
}: {
  searchParams: Promise< { maand?: string; jaar?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const canEdit = canManagePlanning(user.role)

  const supabase = await createClient()
  
  // Get month and year from params or use current
  const now = new Date()
  const maand = params.maand ? parseInt(params.maand) : now.getMonth() + 1
  const jaar = params.jaar ? parseInt(params.jaar) : now.getFullYear()

  // Check if planning exists
  const { data: existingPlanning } = await supabase
    .from('maandplanning')
    .select('*')
    .eq('maand', maand)
    .eq('jaar', jaar)
    .single()

  const maandNamen = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maandplanning</h1>
          <p className="text-muted-foreground">
            Plan de maand {maandNamen[maand - 1]} {jaar}
          </p>
        </div>
        <MaandSelector currentMaand={maand} currentJaar={jaar} />
      </div>

      {canEdit ? (
        <MaandplanningForm 
          initialData={existingPlanning || null}
          maand={maand}
          jaar={jaar}
          userId={user.id}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Je hebt geen rechten om de maandplanning te bewerken.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

