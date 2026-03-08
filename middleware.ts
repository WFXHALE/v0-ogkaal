import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected admin routes
const protectedRoutes = ["/admin", "/admin/dashboard"]
const publicRoutes = ["/admin/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a protected admin route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  const isPublicRoute = publicRoutes.some((route) => pathname === route)

  // Skip non-admin routes
  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next()
  }

  // Get session cookie
  const sessionCookie = request.cookies.get("admin_session")
  const hasSession = !!sessionCookie?.value

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing login with valid session
  if (isPublicRoute && hasSession) {
    const dashboardUrl = new URL("/admin/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
