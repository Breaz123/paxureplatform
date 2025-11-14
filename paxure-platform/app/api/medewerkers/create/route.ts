import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and has permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const canManage = ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer'].includes(profile?.role || '')
    if (!canManage) {
      return NextResponse.json({ 
        error: 'Je hebt geen rechten om medewerkers aan te maken. Alleen coaches en hogere rollen kunnen medewerkers toevoegen.'
      }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role, capaciteiten_goed, capaciteiten_gemiddeld, capaciteiten_slecht } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Use service role to create user (requires SUPABASE_SERVICE_ROLE_KEY)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 })
    }

    // Create profile using admin client to bypass RLS
    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: authData.user.id,
      email,
      full_name: full_name || null,
      role: role || 'maatwerker',
      capaciteiten_goed: capaciteiten_goed && capaciteiten_goed.length > 0 ? capaciteiten_goed : null,
      capaciteiten_gemiddeld: capaciteiten_gemiddeld && capaciteiten_gemiddeld.length > 0 ? capaciteiten_gemiddeld : null,
      capaciteiten_slecht: capaciteiten_slecht && capaciteiten_slecht.length > 0 ? capaciteiten_slecht : null,
    })

    if (profileError) {
      // Try to delete auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error) {
    console.error('Error creating medewerker:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

