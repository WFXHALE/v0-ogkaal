"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

const KEYFRAMES = `
@keyframes og-sweep {
  0%   { left: -80%; }
  60%  { left: 130%; }
  100% { left: 130%; }
}
@keyframes og-box-entry {
  0%   { opacity: 0; transform: scale(0.88); }
  100% { opacity: 1; transform: scale(1); }
}
`

function useInjectKeyframes() {
  useEffect(() => {
    if (document.getElementById("og-loader-keyframes")) return
    const style = document.createElement("style")
    style.id = "og-loader-keyframes"
    style.textContent = KEYFRAMES
    document.head.appendChild(style)
  }, [])
}

export function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const prevPath = useRef<string | null>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useInjectKeyframes()

  const hide = () => {
    setFading(true)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setFading(false)
    }, 400)
  }

  useEffect(() => {
    // Skip on initial mount — the page is already rendered
    if (prevPath.current === null) {
      prevPath.current = pathname
      return
    }
    // Skip if same path
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    // Clear any existing timers
    if (showTimer.current) clearTimeout(showTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)

    // Only show the loader if navigation takes longer than 200ms
    showTimer.current = setTimeout(() => {
      setFading(false)
      setVisible(true)

      // Auto-hide after a max of 800ms (page should be ready by then)
      hideTimer.current = setTimeout(hide, 800)
    }, 200)

    return () => {
      // Pathname changed again before 200ms → cancel, never show
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0B0E11",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Gold square logo */}
      <div
        style={{
          position: "relative",
          width: 88,
          height: 88,
          borderRadius: 14,
          backgroundColor: "#FCD535",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          animation: "og-box-entry 0.4s ease both",
          flexShrink: 0,
        }}
      >
        {/* Light sweep */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "55%",
            background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
            animation: "og-sweep 2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* OG text */}
        <span
          aria-label="OG KAAL TRADER"
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "#0B0E11",
            userSelect: "none",
          }}
        >
          OG
        </span>
      </div>
    </div>
  )
}
