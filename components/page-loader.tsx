"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

export function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const prevPath = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show loader on initial mount and on every route change
  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    // Show the loader
    setFading(false)
    setVisible(true)

    // After the page content has had time to paint, fade out
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setFading(true)
      timerRef.current = setTimeout(() => {
        setVisible(false)
      }, 500) // matches fade-out duration
    }, 900)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "all" }}
    >
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center">
        <span className="og-loader-ring" />
        {/* OG text */}
        <span className="og-loader-text" aria-label="OG KAAL TRADER">OG</span>
      </div>
    </div>
  )
}
