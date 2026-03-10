"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

// Pages where the back button should NOT appear
const HIDE_ON = ["/", "/admin-login", "/admin"]

export function BackButton() {
  const router   = useRouter()
  const pathname = usePathname()

  // Hide on home and admin entry points
  if (HIDE_ON.some(p => pathname === p)) return null

  const handleBack = () => {
    // If there is a previous page in the browser history, go back
    // Otherwise fall back to the home page
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <div className="w-full bg-background/60 border-b border-border/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          aria-label="Go back"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      </div>
    </div>
  )
}
