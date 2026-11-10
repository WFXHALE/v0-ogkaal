import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '@/lib/admin-session'
import { createServerClient } from '@supabase/ssr'

const ADMIN_PAGE_PREFIX = '/admin'
const ADMIN_API_PREFIX = '/api/admin'
const PUBLIC_ADMIN_API = new Set(['/api/admin/verify-key', '/api/admin/verify-google'])

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

async function isMaintenanceModeOn(request: NextRequest): Promise<boolean> {
  try {
    const url = new URL('/api/pricing', request.url)
    const res = await fetch(url.toString(), {
      headers: { 'x-internal-middleware': '1' },
      cache: 'no-store',
    })
    if (!res.ok) return false
    const json = await res.json() as { config?: { maintenanceMode?: boolean } }
    return json?.config?.maintenanceMode === true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPage = pathname === ADMIN_PAGE_PREFIX || pathname.startsWith(ADMIN_PAGE_PREFIX + '/')
  const isAdminApi = pathname === ADMIN_API_PREFIX || pathname.startsWith(ADMIN_API_PREFIX + '/')

  const publicAdminPost = request.method === 'POST' && (pathname === '/api/admin/submissions' || pathname === '/api/admin/notifications')
  if (isAdminApi && !PUBLIC_ADMIN_API.has(pathname) && !publicAdminPost) {
    const token = request.cookies.get('admin_session')?.value
    if (!(await verifyAdminSessionToken(token))) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (isAdminPage) {
    const token = request.cookies.get('admin_session')?.value
    if (!(await verifyAdminSessionToken(token))) {
      const url = request.nextUrl.clone()
      url.pathname = '/kaal-admin-console'
      return NextResponse.redirect(url)
    }
  }

  if (!isMaintenanceBypassed(pathname)) {
    const maintenanceOn = await isMaintenanceModeOn(request)
    if (maintenanceOn) {
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      return NextResponse.redirect(url)
    }
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  // Verify/refresh the cookie-backed Supabase session on each matched request.
  await supabase.auth.getClaims()

  if (
    pathname.startsWith('/static') ||
    pathname.match(/\.(js|css|webp|jpg|jpeg|png|gif|svg|woff|woff2)$/i)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
