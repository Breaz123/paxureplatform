import { createClient } from './supabase/server'
import { UserRole } from './types'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

export function canEdit(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer'].includes(userRole)
}

export function canManageDocuments(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer'].includes(userRole)
}

export function canManagePlanning(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer'].includes(userRole)
}

