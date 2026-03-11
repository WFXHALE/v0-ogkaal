"use client"

import { useEffect } from "react"
import { initErrorMonitoring } from "@/lib/error-monitor"
// app is imported to ensure Firebase initialises on mount (side-effect import)
import "@/lib/firebase"

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Firebase app boots via the import above; just init error monitoring
    initErrorMonitoring()
  }, [])

  return <>{children}</>
}
