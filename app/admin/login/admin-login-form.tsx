"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─────────────────────────────────────────────────────────────────────────────
// Drop intro — dot falls from top, expands, morphs into "WELCOME KAAL"
// Runs once for ~2.4 s, then fades out and reveals the login card.
// All animation is pure CSS keyframes — no external libs, 60fps on GPU.
// ─────────────────────────────────────────────────────────────────────────────
function DropIntro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Total animation: 2.4 s then fade out 0.4 s → 2.8 s total
    const id = setTimeout(onDone, 2800)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        animation: "intro-fade-out 0.4s ease forwards 2.4s",
        willChange: "opacity",
      }}
    >
      <style>{`
        /* ── Dot drops from top of screen to centre ── */
        @keyframes dot-drop {
          0%   { transform: translateY(-45vh) scale(1);   opacity: 0; }
          12%  { opacity: 1; }
          70%  { transform: translateY(0)     scale(1);   opacity: 1; }
          80%  { transform: translateY(0)     scale(22);  opacity: 1; }
          100% { transform: translateY(0)     scale(22);  opacity: 1; }
        }

        /* ── Text fades in after dot expands ── */
        @keyframes text-reveal {
          0%,72%  { opacity: 0; letter-spacing: 0.6em; }
          82%     { opacity: 0; }
          100%    { opacity: 1; letter-spacing: 0.25em; }
        }

        /* ── Dot sub-text line ── */
        @keyframes sub-reveal {
          0%,82%  { opacity: 0; }
          100%    { opacity: 0.45; }
        }

        /* ── Screen fade out ── */
        @keyframes intro-fade-out {
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>

      {/* Expanding dot */}
      <div
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#FCD535",
          animation: "dot-drop 2.0s cubic-bezier(0.16,1,0.3,1) forwards",
          willChange: "transform, opacity",
          transformOrigin: "center center",
        }}
      />

      {/* Text — sits above the dot layer so it's visible after expansion */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", userSelect: "none" }}>
        <p
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "clamp(1.6rem, 6vw, 3rem)",
            fontWeight: 700,
            color: "#000",
            letterSpacing: "0.25em",
            animation: "text-reveal 2.0s cubic-bezier(0.16,1,0.3,1) forwards",
            willChange: "opacity, letter-spacing",
            margin: 0,
            lineHeight: 1,
          }}
        >
          WELCOME KAAL
        </p>
        <p
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
            fontWeight: 500,
            color: "#000",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            animation: "sub-reveal 2.0s cubic-bezier(0.16,1,0.3,1) forwards",
            willChange: "opacity",
            margin: "0.5em 0 0",
          }}
        >
          OG KAAL TRADER — Admin
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────
export function AdminLoginForm() {
  const router = useRouter()

  const [showIntro, setShowIntro]   = useState(true)
  const [secretKey, setSecretKey]   = useState("")
  const [error, setError]           = useState("")
  const [isLoading, setIsLoading]   = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    setIsChecking(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRemainingAttempts(null)
    if (!secretKey.trim()) { setError("Enter the admin secret key"); return }

    setIsLoading(true)
    const r = await loginWithSecretKey(secretKey)

    if (r.success) {
      router.push("/admin")
    } else {
      setError(r.error || "Invalid Key – Access Denied")
      if (r.attemptsRemaining !== undefined) setRemainingAttempts(r.attemptsRemaining)
    }
    setIsLoading(false)
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
      </div>
    )
  }

  const lock = isAccountLocked()

  return (
    <>
      {/* Drop intro — shown once on first render */}
      {showIntro && <DropIntro onDone={() => setShowIntro(false)} />}

      {/* Login screen — sits behind the intro, visible once intro fades */}
      <div
        className="min-h-screen bg-black flex items-center justify-center p-4"
        style={{
          opacity: showIntro ? 0 : 1,
          transition: "opacity 0.5s ease",
          transitionDelay: showIntro ? "0s" : "0.1s",
        }}
      >
        <Link
          href="/"
          className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="w-full max-w-sm">
          {/* Wordmark */}
          <div className="text-center mb-8 select-none">
            <div className="inline-block">
              <div
                className="w-2 h-2 rounded-full bg-primary mx-auto mb-5"
                style={{ boxShadow: "0 0 18px 4px rgba(252,213,53,0.55)" }}
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Admin Access</h1>
            <p className="text-xs text-neutral-500 mt-1.5 tracking-[0.2em] uppercase">OG KAAL TRADER — Restricted</p>
          </div>

          {/* Card */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl">

            {(lock.locked) && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4 text-center">
                <p className="text-sm font-semibold text-red-400">Security Lock Activated</p>
                <p className="text-xs text-red-400/70 mt-1">
                  Access blocked for 24 hours.
                  {lock.remainingSeconds ? ` (${Math.ceil(lock.remainingSeconds / 3600)}h remaining)` : ""}
                </p>
              </div>
            )}

            {error && !lock.locked && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
                <p className="text-sm text-red-400">{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-xs text-red-400/60 mt-1">
                    {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining before 24-hour lockout
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase mb-2">
                  Secret Key
                </label>
                <div
                  className="relative"
                  style={{
                    borderRadius: "0.75rem",
                    boxShadow: inputFocused ? "0 0 0 2px rgba(252,213,53,0.35), 0 0 16px rgba(252,213,53,0.15)" : "none",
                    transition: "box-shadow 0.25s ease",
                  }}
                >
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={secretKey}
                    onChange={e => { setSecretKey(e.target.value); setError("") }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Enter secret key"
                    autoComplete="off"
                    disabled={lock.locked || isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || lock.locked}
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-5 tracking-wide"
              >
                {isLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Verifying...</>
                ) : (
                  "Unlock Admin Panel"
                )}
              </Button>
            </form>

            <p className="text-xs text-neutral-600 text-center mt-4">
              5 attempts max — failed attempts trigger a 24-hour lockout.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
