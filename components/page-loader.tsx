"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

// Minimal two-arrow rotating spinner — appears only if navigation takes > 300ms.
// Never blocks the page. No full-screen overlay.
export function PageLoader() {
  const pathname  = usePathname()
  const [visible, setVisible]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const prevPath  = useRef<string | null>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
    prevPath.current = pathname
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mounted || prevPath.current === null) return
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    if (showTimer.current) clearTimeout(showTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)

    // Only appear if navigation takes longer than 300ms
    showTimer.current = setTimeout(() => {
      setVisible(true)
      hideTimer.current = setTimeout(() => setVisible(false), 1000)
    }, 300)

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname, mounted])

  if (!mounted || !visible) return null

  return (
    <>
      <style>{`
        @keyframes spin-cw  { to { transform: rotate(360deg); } }
        @keyframes spin-ccw { to { transform: rotate(-360deg); } }
      `}</style>
      {/* Fixed bottom-right corner — never blocks content */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 4,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: 16,
            color: "#FCD535",
            animation: "spin-cw 0.7s linear infinite",
            willChange: "transform",
            lineHeight: 1,
          }}
        >
          ↻
        </span>
        <span
          style={{
            display: "inline-block",
            fontSize: 16,
            color: "rgba(252,213,53,0.5)",
            animation: "spin-ccw 0.7s linear infinite",
            willChange: "transform",
            lineHeight: 1,
          }}
        >
          ↺
        </span>
      </div>
    </>
  )
}
