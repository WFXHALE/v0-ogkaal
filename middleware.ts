import { NextRequest, NextResponse } from 'next/server'

// ── Admin auth ───────────────────────────────────────────────────────────────
const ADMIN_ROUTES       = ['/admin', '/admin/dashboard', '/admin/users', '/admin/payments']
const ADMIN_BYPASS_PATHS = ['/admin', '/kaal-admin-console', '/maintenance']

function isAdminAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin_session')
  return !!cookie?.value
}

// ── Maintenance mode ─────────────────────────────────────────────────────────
// Paths that always remain accessible regardless of maintenance mode
const MAINTENANCE_BYPASS_PREFIXES = [
  '/admin',
  '/kaal-admin-console',
  '/maintenance',
  '/api/',
  '/_next',
]

function isMaintenanceBypassed(pathname: string): boolean {
  return MAINTENANCE_BYPASS_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix)
  )
}

/**
 * Check if maintenance mode is enabled by reading from Supabase REST API.
 * We use the raw REST API here because middleware runs on the Edge runtime
 * and cannot use the Node.js-based @supabase/ssr createServerClient.
 * Result is cached for 10 seconds via the `next` option to avoid hammering the DB.
 */
async function isMaintenanceModeOn(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  // Use the service role key so we can bypass the restrictive admin_settings RLS policy.
  // The anon key cannot read admin_settings (only the admin_all_settings policy allows it).
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return false

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/admin_settings?key=eq.system_config&select=value`,
      {
        headers: {
          apikey:        supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept:        'application/json',
        },
        // Cache for 10 seconds so each request isn't a fresh DB hit
        next: { revalidate: 10 },
      }
    )
    if (!res.ok) return false
    const rows = await res.json() as Array<{ value: Record<string, unknown> }>
    const config = rows?.[0]?.value
    return config?.maintenanceMode === true
  } catch {
    // If the DB check fails, don't block the site
    return false
  }
}

// ── Main middleware ──────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Admin route protection (redirect unauthenticated users to login)
  const isProtectedAdmin = ADMIN_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  if (isProtectedAdmin && !isAdminAuthenticated(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/kaal-admin-console'
    return NextResponse.redirect(url)
  }

  // 2. Maintenance mode — skip for admin and system paths
  if (!isMaintenanceBypassed(pathname)) {
    const isAdmin = ADMIN_BYPASS_PATHS.some(
      p => pathname === p || pathname.startsWith(p + '/')
    )
    if (!isAdmin) {
      const maintenanceOn = await isMaintenanceModeOn()
      if (maintenanceOn) {
        const url = request.nextUrl.clone()
        url.pathname = '/maintenance'
        return NextResponse.redirect(url)
      }
    }
  }

  const response = NextResponse.next()

  // 3. Cache headers for static assets
  if (
    pathname.startsWith('/static') ||
    pathname.match(/\.(js|css|webp|jpg|jpeg|png|gif|svg|woff|woff2)$/i)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // 4. Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
