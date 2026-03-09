"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

// Inject keyframes once into the document head
const KEYFRAMES = `
@keyframes og-shimmer {
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
}
@keyframes og-ring-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes og-ring-pulse {
  0%, 100% { opacity: 0.4; box-shadow: 0 0 0 0 rgba(252,213,53,0); }
  50%       { opacity: 1;   box-shadow: 0 0 32px 8px rgba(252,213,53,0.45); }
}
@keyframes og-entry {
  0%   { opacity: 0; transform: scale(0.85); }
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
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const prevPath = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useInjectKeyframes()

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    setFading(false)
    setVisible(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setFading(true)
      timerRef.current = setTimeout(() => setVisible(false), 600)
    }, 1000)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
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
        transition: "opacity 0.6s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Container */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Spinning dashed gold ring — outermost */}
        <div style={{
          position: "absolute",
          width: "clamp(160px, 28vw, 240px)",
          height: "clamp(160px, 28vw, 240px)",
          borderRadius: "50%",
          border: "2px dashed rgba(252,213,53,0.30)",
          animation: "og-ring-spin 8s linear infinite",
        }} />

        {/* Pulsing solid gold ring — middle */}
        <div style={{
          position: "absolute",
          width: "clamp(130px, 22vw, 200px)",
          height: "clamp(130px, 22vw, 200px)",
          borderRadius: "50%",
          border: "2px solid rgba(252,213,53,0.55)",
          animation: "og-ring-pulse 1.8s ease-in-out infinite",
        }} />

        {/* OG text */}
        <span
          aria-label="OG KAAL TRADER"
          style={{
            position: "relative",
            zIndex: 1,
            fontFamily: "inherit",
            fontSize: "clamp(5rem, 14vw, 9rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            // Gold shimmer gradient
            background: "linear-gradient(105deg, #9a6a00 0%, #FCD535 20%, #fff7c0 38%, #FCD535 52%, #F0B90B 72%, #9a6a00 100%)",
            backgroundSize: "300% auto",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "og-shimmer 2.2s linear infinite, og-entry 0.5s ease both",
            // Glow
            filter: "drop-shadow(0 0 20px rgba(252,213,53,0.8)) drop-shadow(0 0 50px rgba(252,213,53,0.4))",
          }}
        >
          OG
        </span>

        {/* Subtle tagline */}
        <span style={{
          position: "absolute",
          bottom: "clamp(-28px, -5vw, -36px)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontSize: "clamp(0.55rem, 1.5vw, 0.7rem)",
          fontWeight: 600,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(252,213,53,0.55)",
        }}>
          KAAL TRADER
        </span>
      </div>
    </div>
  )
}
