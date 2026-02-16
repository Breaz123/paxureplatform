import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Same defaults as the browser client – these match your Supabase project
// and are safe to expose (anon key).
const DEFAULT_SUPABASE_URL = 'https://xorziikvgsgirkyasedm.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcnppaWt2Z3NnaXJreWFzZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTk2NTMsImV4cCI6MjA3ODY5NTY1M30.tqa1j7yhxwGcfRo5Ctd__b5Yifr-N-S1vuSryop8UhM'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

