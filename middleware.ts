import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/admin/dashboard"]

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/admin/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session cookie
  const sessionCookie = request.cookies.get("admin_session")
  const isAuthenticated = !!sessionCookie?.value

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if current path is an auth route (login page)
  const isAuthRoute = authRoutes.some((route) => pathname === route)

  // Handle /admin base route - redirect to appropriate page
  if (pathname === "/admin") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing login page with valid session
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
