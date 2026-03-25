"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSiteConfig } from "@/lib/use-site-config"

// Paths exempt from maintenance blocking on the client side
// (matches the server-side middleware bypass list)
const BYPASS_PREFIXES = ["/admin", "/kaal-admin-console", "/maintenance"]

/**
 * Client-side companion to the middleware maintenance check.
 * The middleware blocks server-side navigations (full page loads).
 * This guard catches client-side navigations (Next.js router pushes)
 * that happen after the initial load.
 */
export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { maintenanceMode } = useSiteConfig()
  const pathname = usePathname()
  const router   = useRouter()

  const isBypassed = BYPASS_PREFIXES.some(
    p => pathname === p || pathname.startsWith(p + "/")
  )

  useEffect(() => {
    if (maintenanceMode && !isBypassed) {
      router.replace("/maintenance")
    }
  }, [maintenanceMode, isBypassed, router])

  // While maintenance is ON and we haven't bypassed, render nothing
  // (the redirect above will kick in after useSiteConfig loads)
  if (maintenanceMode && !isBypassed) {
    return null
  }

  return <>{children}</>
}
