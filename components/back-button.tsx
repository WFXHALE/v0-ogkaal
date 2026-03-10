"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

// Pages where the back button should NOT appear
const HIDE_ON = ["/", "/admin-login", "/admin"]

// On the dashboard login page the label is always "Back to Home"
const HOME_ONLY = ["/dashboard", "/dashboard/reset-password"]

export function BackButton() {
  const router   = useRouter()
  const pathname = usePathname()
  const [hasPrev, setHasPrev] = useState(false)

  // Track whether the user navigated to this page from within the app.
  // We store the previous pathname in sessionStorage on every route change.
  useEffect(() => {
    const prev = sessionStorage.getItem("og_prev_path")
    // A "real" previous page exists if it was recorded and is different from
    // the current page and is not a reload of the same page.
    setHasPrev(!!prev && prev !== pathname)

    // Record current path as the previous path for the next navigation
    return () => {
      sessionStorage.setItem("og_prev_path", pathname)
    }
  }, [pathname])

  // Hide on home and admin entry points
  if (HIDE_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) return null

  // Force "Back to Home" on dashboard login and reset pages, or when no history
  const forceHome = HOME_ONLY.some(p => pathname === p) || !hasPrev

  const label = forceHome ? "Back to Home" : "Back"

  const handleBack = () => {
    if (forceHome) {
      router.push("/")
    } else {
      router.back()
    }
  }

  return (
    <div className="w-full bg-background/60 border-b border-border/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          aria-label={label}
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          {label}
        </button>
      </div>
    </div>
  )
}
