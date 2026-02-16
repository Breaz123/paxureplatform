import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Read request body FIRST (can only be read once in Next.js)
    const body = await request.json()
    const { email, password, full_name, role, capaciteiten_goed, capaciteiten_gemiddeld, capaciteiten_slecht, werkdagen_per_week, werkdagen_regime, werkdagen_dagen } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check if user is authenticated and has permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    
    // Debug: Log all environment variables that start with SUPABASE
    console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)
    console.log('SUPABASE_SERVICE_ROLE_KEY first 50 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50) || 'NOT SET')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY first 50 chars:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) || 'NOT SET')
    
    // Check if they're accidentally the same
    if (process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is the same as NEXT_PUBLIC_SUPABASE_ANON_KEY!')
      return NextResponse.json({ 
        error: 'De SUPABASE_SERVICE_ROLE_KEY is hetzelfde als de NEXT_PUBLIC_SUPABASE_ANON_KEY. Je moet de service_role key gebruiken, niet de anon key!' 
      }, { status: 500 })
    }
    
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
      return NextResponse.json({ 
        error: 'Service role key niet geconfigureerd. Controleer je .env.local bestand en voeg SUPABASE_SERVICE_ROLE_KEY toe. Zie env.template voor het juiste formaat.' 
      }, { status: 500 })
    }
    
    // Validate service role key format (should start with eyJ and contain service_role)
    if (!supabaseServiceKey.startsWith('eyJ')) {
      console.error('Service role key does not appear to be a valid JWT token')
      return NextResponse.json({ 
        error: 'Service role key heeft een ongeldig formaat. Controleer of je de juiste service_role key hebt gekopieerd uit Supabase Dashboard → Settings → API.' 
      }, { status: 500 })
    }
    
    // Decode JWT to verify it's a service_role key (basic check)
    try {
      const jwtParts = supabaseServiceKey.split('.')
      if (jwtParts.length === 3) {
        const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString())
        console.log('JWT payload role:', payload.role)
        console.log('JWT payload full:', JSON.stringify(payload, null, 2))
        if (payload.role !== 'service_role') {
          console.error('WARNING: The key does not have service_role role! Role found:', payload.role)
          return NextResponse.json({ 
            error: `De key heeft niet de juiste rol. Gevonden rol: ${payload.role}. Je moet de service_role key gebruiken, niet de anon key. Controleer in Supabase Dashboard → Settings → API → Legacy anon, service_role API keys. De key die je nu gebruikt heeft rol "${payload.role}" in plaats van "service_role".` 
          }, { status: 500 })
        }
        console.log('Service role key verified: role is service_role')
      }
    } catch (err) {
      console.warn('Could not decode JWT for verification:', err)
      // Continue anyway - might be a valid key but we can't decode it
    }
    console.log('=== END ENVIRONMENT VARIABLES DEBUG ===')

    // Create admin client with service role key
    // For auth.admin operations, we need to explicitly set the Authorization header
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
      },
    })
    
    // Verify the admin client is working by testing a simple query
    console.log('Testing admin client connection...')
    try {
      const { data: testData, error: testError } = await adminSupabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Admin client test failed:', testError)
        return NextResponse.json({ 
          error: `Admin client configuratie probleem: ${testError.message}. Controleer of je SUPABASE_SERVICE_ROLE_KEY correct is.` 
        }, { status: 500 })
      }
      console.log('Admin client connection verified')
    } catch (err) {
      console.error('Exception testing admin client:', err)
      return NextResponse.json({ 
        error: `Admin client test mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}` 
      }, { status: 500 })
    }

    // Use admin client to fetch user profile (bypasses RLS)
    // This prevents RLS issues when checking permissions
    // First try to get all profiles for this user (in case there are duplicates)
    let profiles: any[] | null = null
    let profilesError: any = null
    
    try {
      const result = await adminSupabase
        .from('profiles')
        .select('role, id, email')
        .eq('id', user.id)
      
      profiles = result.data
      profilesError = result.error
    } catch (err) {
      console.error('Exception fetching profiles:', err)
      profilesError = err
    }

    // Log for debugging
    console.log('=== DEBUG MEDEWERKER CREATE ===')
    console.log('User ID:', user.id)
    console.log('User email:', user.email)
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    console.log('Service key length:', supabaseServiceKey?.length || 0)
    console.log('Profiles found:', profiles?.length || 0)
    console.log('Profiles data:', JSON.stringify(profiles, null, 2))
    console.log('Profiles error:', profilesError)
    
    // Also try to count all profiles to see if the admin client works
    try {
      const { count, error: countError } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      console.log('Total profiles in DB:', count)
      console.log('Count error:', countError)
    } catch (err) {
      console.error('Exception counting profiles:', err)
    }
    
    console.log('=== END DEBUG ===')

    // If there's an error fetching profiles, try to create the profile anyway
    // The error might be due to RLS even with admin client, so we'll try to create it
    if (profilesError) {
      console.warn('Error fetching profiles (will try to create profile):', profilesError)
      // Don't return error immediately - try to create profile first
      profiles = null // Force profile creation
    }

    if (!profiles || profiles.length === 0) {
      // Profile doesn't exist, try to create it using the database function
      // This function bypasses RLS using SECURITY DEFINER
      console.log('Profile not found, attempting to create one using database function...')
      console.log('User email:', user.email)
      
      // Use RPC to call the database function that bypasses RLS
      const { data: newProfile, error: createError } = await adminSupabase
        .rpc('create_profile_safe', {
          p_user_id: user.id,
          p_email: user.email || '',
          p_full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          p_role: 'admin' // Create as admin so they can manage medewerkers
        })
      
      if (createError) {
        console.error('Failed to create profile:', createError)
        // Check if it's an RLS or permission error
        const errorMsg = createError.message || 'Onbekende fout'
        if (errorMsg.includes('infinite recursion') || errorMsg.includes('permission denied') || errorMsg.includes('RLS')) {
          return NextResponse.json({ 
            error: `RLS probleem: ${errorMsg}. De database policies moeten worden gerepareerd. Neem contact op met een beheerder.`
          }, { status: 500 })
        }
        return NextResponse.json({ 
          error: `Je gebruikersprofiel bestaat niet en kon niet automatisch worden aangemaakt. Fout: ${errorMsg}`
        }, { status: 500 })
      }
      
      if (!newProfile || (Array.isArray(newProfile) && newProfile.length === 0)) {
        console.error('Profile creation returned empty result')
        return NextResponse.json({ 
          error: `Je gebruikersprofiel kon niet worden aangemaakt. De functie gaf geen resultaat terug.`
        }, { status: 500 })
      }
      
      console.log('Profile created successfully:', newProfile)
      // Use the newly created profile (it's returned as an array)
      // The function returns columns with 'result_' prefix, map them back
      const profileData = Array.isArray(newProfile) ? newProfile[0] : newProfile
      const userProfile = {
        id: profileData.result_id || profileData.id,
        email: profileData.result_email || profileData.email,
        full_name: profileData.result_full_name || profileData.full_name,
        role: profileData.result_role || profileData.role
      }
      
      // Check if the newly created user has permission
      const allowedRoles = ['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer']
      const canManage = allowedRoles.includes(userProfile.role || '')
      
      if (!canManage) {
        return NextResponse.json({ 
          error: `Je gebruikersprofiel is zojuist aangemaakt met rol '${userProfile.role}'. Je hebt geen rechten om medewerkers aan te maken. Vraag een beheerder om je rol te wijzigen naar coach of hoger.`
        }, { status: 403 })
      }
      
      // Continue with the rest of the function
    } else {
      // Profile exists, use it
      const userProfile = profiles[0]
      console.log('User role:', userProfile?.role)

      const allowedRoles = ['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer']
      const canManage = allowedRoles.includes(userProfile.role || '')
      
      console.log('Can manage:', canManage, 'Role:', userProfile.role, 'Allowed roles:', allowedRoles)
      
      if (!canManage) {
        return NextResponse.json({ 
          error: `Je hebt geen rechten om medewerkers aan te maken. Je huidige rol is: ${userProfile.role || 'onbekend'}. Alleen coaches en hogere rollen kunnen medewerkers toevoegen.`
        }, { status: 403 })
      }
    }

    // adminSupabase is already created above

    // Create auth user
    console.log('Creating auth user for:', email)
    console.log('Service key configured:', !!supabaseServiceKey)
    console.log('Service key starts with:', supabaseServiceKey?.substring(0, 20) || 'N/A')
    
    // Try to create auth user with admin client
    // Note: The service role key should have full permissions
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email to avoid email verification
      user_metadata: {
        full_name,
      },
      app_metadata: {
        provider: 'email',
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      console.error('Auth error details:', JSON.stringify(authError, null, 2))
      
      // Provide more specific error messages
      let errorMsg = authError.message || 'Onbekende fout'
      
      if (errorMsg.includes('User not allowed')) {
        // This can mean:
        // 1. Service role key is incorrect (but user says it's correct)
        // 2. Auth settings in Supabase Dashboard are blocking user creation
        // 3. The admin client is not properly configured
        return NextResponse.json({ 
          error: `Auth configuratie probleem: "User not allowed". Dit kan betekenen dat:
1. De Auth instellingen in Supabase Dashboard het aanmaken van gebruikers blokkeren
2. Controleer in Supabase Dashboard → Authentication → Settings of "Enable email signup" aan staat
3. Controleer of er geen restricties zijn op het aanmaken van gebruikers via de API
4. Verifieer dat je SUPABASE_SERVICE_ROLE_KEY de juiste service_role key is (niet de anon key)
Fout details: ${errorMsg}`
        }, { status: 400 })
      }
      
      if (errorMsg.includes('Invalid API key') || errorMsg.includes('JWT')) {
        return NextResponse.json({ 
          error: `Service role key is ongeldig. Controleer je SUPABASE_SERVICE_ROLE_KEY in .env.local.`
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: `Fout bij aanmaken van gebruiker: ${errorMsg}` 
      }, { status: 400 })
    }
    
    if (!authData || !authData.user) {
      console.error('Auth user creation returned no user data')
      return NextResponse.json({ 
        error: `Fout bij aanmaken van gebruiker: Geen gebruiker data teruggekregen` 
      }, { status: 400 })
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Create profile using the database function to bypass RLS
    console.log('Creating profile for new medewerker:', authData.user.id)
    const { data: newMedewerkerProfile, error: insertProfileError } = await adminSupabase
      .rpc('create_profile_safe', {
        p_user_id: authData.user.id,
        p_email: email,
        p_full_name: full_name || null,
        p_role: (role || 'maatwerker') as any
      })

    if (insertProfileError || !newMedewerkerProfile) {
      console.error('Error creating profile for new medewerker:', insertProfileError)
      // Try to delete auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: `Fout bij aanmaken van profiel: ${insertProfileError?.message || 'Onbekende fout'}` 
      }, { status: 400 })
    }

    console.log('Profile created for new medewerker:', newMedewerkerProfile)

    // Update the profile with additional fields using admin client
    // The function only creates basic fields, so we update the rest
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        capaciteiten_goed: capaciteiten_goed && capaciteiten_goed.length > 0 ? capaciteiten_goed : null,
        capaciteiten_gemiddeld: capaciteiten_gemiddeld && capaciteiten_gemiddeld.length > 0 ? capaciteiten_gemiddeld : null,
        capaciteiten_slecht: capaciteiten_slecht && capaciteiten_slecht.length > 0 ? capaciteiten_slecht : null,
        werkdagen_per_week: werkdagen_per_week ?? 5.0,
        werkdagen_regime: werkdagen_regime || null,
        werkdagen_dagen: werkdagen_dagen && werkdagen_dagen.length > 0 ? werkdagen_dagen : null,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Error updating profile with additional fields:', updateError)
      // Don't fail completely, the profile was created successfully
    }

    console.log('Medewerker created successfully!')
    return NextResponse.json({ success: true, user: authData.user })
  } catch (error) {
    console.error('=== ERROR CREATING MEDEWERKER ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error:', JSON.stringify(error, null, 2))
    console.error('=== END ERROR ===')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

