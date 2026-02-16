import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import VerlofkalenderForm from '@/components/verlof/verlofkalender-form'

export const dynamic = 'force-dynamic'

export default async function VerlofkalenderPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const canEdit = canManagePlanning(user.role)

  // Get all verlof entries
  const { data: verlofEntries } = await supabase
    .from('verlof')
    .select(`
      *,
      medewerker:profiles!verlof_medewerker_id_fkey(id, full_name, email)
    `)
    .order('start_datum', { ascending: true })

  // Get all medewerkers for the form
  const { data: medewerkers } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verlofkalender</h1>
        <p className="text-muted-foreground">
          Beheer verlof, ziekte en andere afwezigheden
        </p>
      </div>

      <VerlofkalenderForm
        initialVerlof={verlofEntries || []}
        medewerkers={medewerkers || []}
        canEdit={canEdit}
        currentUserId={user.id}
      />
    </div>
  )
}

