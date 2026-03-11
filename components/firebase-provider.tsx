"use client"

import { useEffect } from "react"
import { initErrorMonitoring } from "@/lib/error-monitor"
import { getFirebaseApp } from "@/lib/firebase"

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Boot Firebase app and global error listeners once on mount
    getFirebaseApp()
    initErrorMonitoring()
  }, [])

  return <>{children}</>
}
