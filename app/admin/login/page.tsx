"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─── Water drop animation ─────────────────────────────────────────────────────
// Phases: "drop1" → shows "OG"
//         "drop2" → shows "KAAL"
//         "drop3" → shows "WELCOME KAAL"
//         "done"  → unmount overlay, show form
// Total runtime: ~2.8s with 3s hard fallback.
// All animations use translateY (compositor-only, 60fps guaranteed).

const DROP_KEYFRAMES = `
  @keyframes wdrop-fall {
    0%   { transform: translateY(-46vh) scale(0.6); opacity: 0; }
    12%  { opacity: 1; }
    55%  { transform: translateY(0) scale(1); }
    63%  { transform: translateY(-18px) scale(0.92); }
    72%  { transform: translateY(0) scale(1.05); }
    80%  { transform: translateY(-6px) scale(0.98); }
    88%  { transform: translateY(0) scale(1); }
    100% { transform: translateY(0) scale(1); }
  }
  @keyframes wdrop-bounce {
    0%   { transform: translateY(-18px) scale(0.92); }
    22%  { transform: translateY(0) scale(1.08); }
    40%  { transform: translateY(-10px) scale(0.96); }
    58%  { transform: translateY(0) scale(1.03); }
    76%  { transform: translateY(-4px) scale(0.99); }
    100% { transform: translateY(0) scale(1); }
  }
  @keyframes wtext-in {
    0%   { opacity: 0; transform: scale(0.82) translateY(10px); filter: blur(6px); }
    55%  { opacity: 1; transform: scale(1.05) translateY(0);    filter: blur(0); }
    100% { opacity: 1; transform: scale(1) translateY(0);       filter: blur(0); }
  }
  @keyframes wtext-out {
    0%   { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.88); }
  }
  @keyframes wsub-in {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
`

type DropPhase = "drop1" | "drop2" | "drop3" | "done"

function WaterDropIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<DropPhase>("drop1")
  const [dotAnim, setDotAnim] = useState("wdrop-fall 1.5s cubic-bezier(0.22,1,0.36,1) forwards")
  const doneCalled = useRef(false)

  const finish = useCallback(() => {
    if (doneCalled.current) return
    doneCalled.current = true
    setPhase("done")
    onDone()
  }, [onDone])

  useEffect(() => {
    // Hard safety — never block form for more than 3.2s
    const safety = setTimeout(finish, 3200)

    // Phase 1: drop1 → after 1s bounce to drop2
    const t1 = setTimeout(() => {
      setPhase("drop2")
      setDotAnim("wdrop-bounce 0.6s cubic-bezier(0.22,1,0.36,1) forwards")
    }, 1000)

    // Phase 2: drop2 → after 1.8s bounce to drop3
    const t2 = setTimeout(() => {
      setPhase("drop3")
      setDotAnim("wdrop-bounce 0.6s cubic-bezier(0.22,1,0.36,1) forwards")
    }, 1800)

    // Phase 3: finish at 2.8s
    const t3 = setTimeout(finish, 2800)

    return () => {
      clearTimeout(safety)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [finish])

  if (phase === "done") return null

  const textMap: Record<DropPhase, string> = {
    drop1: "OG",
    drop2: "KAAL",
    drop3: "WELCOME KAAL",
    done: "",
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "2rem",
      }}
    >
      <style>{DROP_KEYFRAMES}</style>

      {/* Bouncing dot */}
      <div
        key={phase + "-dot"}
        style={{
          width: 14, height: 14, borderRadius: "50%",
          background: "#FCD535",
          boxShadow: "0 0 22px 7px rgba(252,213,53,0.45)",
          animation: dotAnim,
          willChange: "transform, opacity",
          flexShrink: 0,
        }}
      />

      {/* Text — each phase gets a fresh node via key so wtext-in re-fires */}
      <div style={{ position: "relative", height: "5rem", minWidth: "280px", textAlign: "center" }}>
        <span
          key={phase + "-text"}
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            letterSpacing: "0.18em",
            color: "#FCD535",
            animation: "wtext-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
            willChange: "opacity, transform, filter",
          }}
        >
          {textMap[phase]}
        </span>
      </div>

      {/* Sub-label fades in only on final phase */}
      <p
        style={{
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontSize: "0.62rem",
          letterSpacing: "0.38em",
          textTransform: "uppercase",
          color: "rgba(252,213,53,0.35)",
          whiteSpace: "nowrap",
          opacity: phase === "drop3" ? 1 : 0,
          animation: phase === "drop3" ? "wsub-in 0.5s ease forwards" : "none",
        }}
      >
        OG KAAL TRADER — Admin
      </p>
    </div>
  )
}

// ─── 30-second countdown badge ────────────────────────────────────────────────

function CountdownBadge({ onExpire }: { onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(30)
  const expireCalled = useRef(false)

  // Redirect when timer hits 0 — in useEffect, never inside setState updater
  useEffect(() => {
    if (timeLeft === 0 && !expireCalled.current) {
      expireCalled.current = true
      onExpire()
    }
  }, [timeLeft, onExpire])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const urgent = timeLeft <= 10

  return (
    <div
      style={{
        position: "fixed", top: 18, right: 18, zIndex: 300,
        display: "flex", alignItems: "center", gap: "0.4rem",
        padding: "0.35rem 0.75rem",
        borderRadius: "999px",
        background: urgent ? "rgba(239,68,68,0.12)" : "rgba(252,213,53,0.08)",
        border: `1px solid ${urgent ? "rgba(239,68,68,0.35)" : "rgba(252,213,53,0.25)"}`,
        transition: "background 0.3s, border-color 0.3s",
        animation: urgent ? "timer-pulse 1s ease-in-out infinite" : "none",
      }}
    >
      <style>{`
        @keyframes timer-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
      {/* Clock SVG */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke={urgent ? "#ef4444" : "#FCD535"} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: urgent ? "#ef4444" : "#FCD535",
        fontFamily: "monospace",
        transition: "color 0.3s",
      }}>
        {timeLeft}s
      </span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const router = useRouter()

  const [showIntro, setShowIntro]                 = useState(true)
  const [secretKey, setSecretKey]                 = useState("")
  const [error, setError]                         = useState("")
  const [isLoading, setIsLoading]                 = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [showKey, setShowKey]                     = useState(false)

  // Client-only session check — avoids SSR hydration mismatch
  useEffect(() => {
    if (isSessionValid()) {
      router.replace("/admin")
    }
  }, [router])

  const handleExpire = useCallback(() => {
    router.push("/")
  }, [router])

  const lock = isAccountLocked()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secretKey.trim() || isLoading) return
    setError("")
    setRemainingAttempts(null)
    setIsLoading(true)

    const result = await loginWithSecretKey(secretKey.trim())

    if (result.success) {
      router.push("/admin")
    } else {
      setError(result.error ?? "Access denied.")
      if (result.attemptsRemaining !== undefined) {
        setRemainingAttempts(result.attemptsRemaining)
      }
      setSecretKey("")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">

      {/* Water drop intro — full screen overlay */}
      {showIntro && <WaterDropIntro onDone={() => setShowIntro(false)} />}

      {/* 30-second countdown — only visible after intro finishes */}
      {!showIntro && <CountdownBadge onExpire={handleExpire} />}

      {/* Back link */}
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
        </svg>
        Back
      </Link>

      {/* Login card — always rendered behind overlay so no blank screen */}
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <p className="text-3xl font-bold tracking-widest text-[#FCD535] uppercase">
            OG KAAL
          </p>
          <p className="text-xs text-neutral-500 mt-1.5 tracking-[0.25em] uppercase">
            Admin Portal — Restricted
          </p>
        </div>

        {/* Lock notice */}
        {lock.locked && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-sm font-semibold text-red-400">Access Blocked</p>
            <p className="text-xs text-muted-foreground mt-1">
              Too many failed attempts.{" "}
              {lock.remainingSeconds
                ? `Try again in ${Math.ceil(lock.remainingSeconds / 3600)}h.`
                : "Try again later."}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              <circle cx="7.5" cy="15.5" r="5.5"/>
              <path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
            </svg>
            <input
              type={showKey ? "text" : "password"}
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              placeholder="Enter admin secret key"
              autoComplete="current-password"
              disabled={lock.locked || isLoading}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-14 py-3.5 text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-[#FCD535]/60 focus:ring-1 focus:ring-[#FCD535]/30 transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              tabIndex={-1}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
              {remainingAttempts !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || lock.locked || !secretKey.trim()}
            className="w-full bg-[#FCD535] text-black hover:bg-[#e6c22f] font-bold py-3 rounded-xl transition-colors"
          >
            {isLoading ? "Verifying..." : "Unlock Admin Panel"}
          </Button>
        </form>

      </div>
    </div>
  )
}
