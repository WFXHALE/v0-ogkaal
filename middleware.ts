import { NextRequest, NextResponse } from 'next/server'

// Protected admin routes — redirect to the hidden console if no session cookie
const ADMIN_ROUTES = ['/admin', '/admin/dashboard', '/admin/users', '/admin/payments']
const ADMIN_LOGIN_PATHS = ['/admin/login', '/kaal-admin-console']

function isAdminAuthenticated(request: NextRequest): boolean {
  // The session cookie is set by createSession() in admin-auth.ts
  const cookie = request.cookies.get('admin_session')
  return !!cookie?.value
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin/* (but not login page) and /kaal-admin-console itself is always accessible
  const isProtectedAdmin =
    ADMIN_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (isProtectedAdmin && !isAdminAuthenticated(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/kaal-admin-console'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()

  // Add cache headers for static assets
  if (
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.match(/\.(js|css|webp|jpg|jpeg|png|gif|svg|woff|woff2)$/i)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Preload critical resources
  const preloadLinks = '</static/fonts/geist.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
  response.headers.set('Link', preloadLinks)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
