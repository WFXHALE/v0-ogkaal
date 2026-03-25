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
 * Check if maintenance mode is enabled by calling our own /api/pricing route.
 * We cannot call Supabase REST directly from middleware because the DNS for
 * the Supabase project hostname fails in Vercel sandbox environments.
 * /api/pricing uses lib/db (pg over IPv4 pooler) which works correctly.
 */
async function isMaintenanceModeOn(request: NextRequest): Promise<boolean> {
  try {
    // Build an absolute URL to our own /api/pricing endpoint
    const url = new URL('/api/pricing', request.url)
    const res = await fetch(url.toString(), {
      headers: { 'x-internal-middleware': '1' },
      cache: 'no-store',
    })
    if (!res.ok) return false
    const json = await res.json() as { config?: { maintenanceMode?: boolean } }
    return json?.config?.maintenanceMode === true
  } catch {
    // If the check fails, don't block the site
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
      const maintenanceOn = await isMaintenanceModeOn(request)
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
