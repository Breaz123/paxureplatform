import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import AfwezigheidskalenderForm from '@/components/afwezigheid/afwezigheidskalender-form'

export const dynamic = 'force-dynamic'

export default async function AfwezigheidskalenderPage() {
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
      medewerker:profiles!verlof_medewerker_id_fkey(id, full_name, email, werkdagen_per_week, werkdagen_regime, werkdagen_dagen)
    `)
    .order('start_datum', { ascending: true })

  // Get all medewerkers for the form
  const { data: medewerkers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, capaciteiten_goed, capaciteiten_gemiddeld, capaciteiten_slecht, werkdagen_per_week, werkdagen_regime, werkdagen_dagen, created_at, updated_at')
    .order('full_name')

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Afwezigheidskalender</h1>
        <p className="text-muted-foreground">
          Beheer verlof, ziekte en andere afwezigheden
        </p>
      </div>

      <AfwezigheidskalenderForm
        initialVerlof={verlofEntries || []}
        medewerkers={medewerkers || []}
        canEdit={canEdit}
        currentUserId={user.id}
      />
    </div>
  )
}

