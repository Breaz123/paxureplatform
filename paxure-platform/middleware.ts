import { type NextRequest, NextResponse } from 'next/server'

// NOTE:
// We previously used Supabase session handling inside middleware via
// `@/lib/supabase/middleware`, but that module is not supported in
// Edge Functions on Vercel and caused deployment failures.
//
// For now, middleware is a no-op and all auth is handled inside
// server components (see `getCurrentUser` in `lib/auth.ts`).
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

