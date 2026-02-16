import { createClient } from './supabase/server'
import { UserRole } from './types'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in getCurrentUser:', authError)
    return null
  }

  if (!user) {
    return null
  }

  // Try to get profile, but don't fail completely if it doesn't exist
  // We'll create a minimal profile object to allow login
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    // Better error serialization
    const errorInfo = {
      message: profileError.message || 'Unknown error',
      details: profileError.details || 'No details',
      hint: profileError.hint || 'No hint',
      code: profileError.code || 'No code',
      userId: user.id,
      email: user.email,
    }
    
    console.error('Profile error in getCurrentUser:', JSON.stringify(errorInfo, null, 2))
    
    // If profile doesn't exist, try to create it automatically
    const isNotFoundError = 
      profileError.code === 'PGRST116' || 
      profileError.code === '42P01' ||
      profileError.message?.includes('No rows') ||
      profileError.message?.includes('not found') ||
      profileError.message?.includes('does not exist')
    
    if (isNotFoundError) {
      console.log('Profile not found, attempting to create...')
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'maatwerker',
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Failed to create profile:', JSON.stringify({
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code,
          }, null, 2))
          
          // Even if creation fails, return a minimal profile to prevent login loop
          // This allows the user to at least log in, and they can fix their profile later
          return {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'maatwerker' as UserRole,
            capaciteiten_goed: null,
            capaciteiten_gemiddeld: null,
            capaciteiten_slecht: null,
            werkdagen_per_week: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        
        console.log('Profile created successfully:', newProfile)
        return newProfile
      } catch (err: any) {
        console.error('Exception creating profile:', err?.message || err)
        
        // Return minimal profile to prevent login loop
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'maatwerker' as UserRole,
          capaciteiten_goed: null,
          capaciteiten_gemiddeld: null,
          capaciteiten_slecht: null,
          werkdagen_per_week: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    }
    
    // For RLS violations or other errors, return a minimal profile to prevent login loop
    // The user can still access the app, but may have limited functionality
    console.warn('Profile query failed, returning minimal profile to allow login')
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: 'maatwerker' as UserRole,
      capaciteiten_goed: null,
      capaciteiten_gemiddeld: null,
      capaciteiten_slecht: null,
      werkdagen_per_week: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return profile
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

export function canEdit(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'].includes(userRole)
}

export function canManageDocuments(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'].includes(userRole)
}

export function canManagePlanning(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'].includes(userRole)
}

