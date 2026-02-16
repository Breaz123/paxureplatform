import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // In production this should never happen because Vercel env vars are set.
    // If it does, fail softly on the client instead of crashing the whole app.
    console.error(
      'Supabase client: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Check your environment configuration.'
    )
    return createBrowserClient('', '')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

