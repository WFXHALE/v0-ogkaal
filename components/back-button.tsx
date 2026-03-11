"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

// Pages where the back button should NOT appear at all
const HIDE_ON = ["/", "/admin-login", "/admin"]

// Pages that always go back to home (no in-app history expected)
const HOME_ONLY = ["/dashboard", "/dashboard/reset-password"]

interface BackButtonProps {
  /** When true, renders just the button with no wrapper — for embedding inside the header bar */
  inline?: boolean
}

export function BackButton({ inline = false }: BackButtonProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [hasPrev, setHasPrev] = useState(false)

  useEffect(() => {
    const prev = sessionStorage.getItem("og_prev_path")
    setHasPrev(!!prev && prev !== pathname)
    return () => {
      sessionStorage.setItem("og_prev_path", pathname)
    }
  }, [pathname])

  // Hide on home and admin pages
  if (HIDE_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) return null

  const forceHome = HOME_ONLY.some(p => pathname === p) || !hasPrev
  const label = forceHome ? "Back to Home" : "Back"

  const handleBack = () => {
    forceHome ? router.push("/") : router.back()
  }

  const btn = (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors group shrink-0"
      aria-label={label}
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  )

  // Inline mode — just the button, no wrapper (used inside the header bar)
  if (inline) return btn

  // Standalone mode — full-width strip (used on pages without a Header)
  return (
    <div className="w-full bg-background/80 border-b border-border/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        {btn}
      </div>
    </div>
  )
}
