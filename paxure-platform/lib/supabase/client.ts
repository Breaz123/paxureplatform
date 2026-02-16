import { createBrowserClient } from '@supabase/ssr'

// We default to the public Supabase URL and anon key used in development.
// On Vercel, these should be overridden by NEXT_PUBLIC_* environment vars,
// but if they are missing for some reason, the hard-coded values ensure the
// client still works instead of crashing.
const DEFAULT_SUPABASE_URL = 'https://xorziikvgsgirkyasedm.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcnppaWt2Z3NnaXJreWFzZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTk2NTMsImV4cCI6MjA3ODY5NTY1M30.tqa1j7yhxwGcfRo5Ctd__b5Yifr-N-S1vuSryop8UhM'

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

