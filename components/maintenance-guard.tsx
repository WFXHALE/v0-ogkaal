"use client"

import { usePathname } from "next/navigation"
import { useSiteConfig } from "@/lib/use-site-config"
import { MaintenancePage } from "@/components/maintenance-page"

// Routes that remain accessible even during maintenance (admin only)
const BYPASS_PATHS = ["/admin", "/admin/login"]

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { maintenanceMode } = useSiteConfig()
  const pathname = usePathname()

  const isBypassed = BYPASS_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))

  if (maintenanceMode && !isBypassed) {
    return <MaintenancePage />
  }

  return <>{children}</>
}
