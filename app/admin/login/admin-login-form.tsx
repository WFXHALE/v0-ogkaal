"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─────────────────────────────────────────────────────────────────────────────
// Bouncing-dot intro animation
// Uses translateY (compositor-only) — never top/left — for reliable rendering.
// Sequence: dot drops → WELCOME (0.8s) → KAAL (1.5s) → WELCOME KAAL (2.2s)
// Hard fallback: onDone fires at max 3s no matter what.
// ─────────────────────────────────────────────────────────────────────────────
function BouncingDotIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase]     = useState<"dropping"|"word1"|"word2"|"word3"|"exit">("dropping")
  const [visible, setVisible] = useState(true)
  const calledDone = useRef(false)

  const finish = useCallback(() => {
    if (calledDone.current) return
    calledDone.current = true
    setVisible(false)
    onDone()
  }, [onDone])

  useEffect(() => {
    // Hard safety fallback — never let intro block the form for more than 3s
    const safety = setTimeout(finish, 3000)

    const t1 = setTimeout(() => setPhase("word1"), 800)
    const t2 = setTimeout(() => setPhase("word2"), 1500)
    const t3 = setTimeout(() => setPhase("word3"), 2200)
    const t4 = setTimeout(() => { setPhase("exit"); finish() }, 2800)

    return () => {
      clearTimeout(safety)
      clearTimeout(t1); clearTimeout(t2)
      clearTimeout(t3); clearTimeout(t4)
    }
  }, [finish])

  if (!visible) return null

  const wordMap: Record<string, string> = {
    word1: "WELCOME",
    word2: "KAAL",
    word3: "WELCOME KAAL",
  }
  const currentWord = wordMap[phase] ?? ""

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "#000", zIndex: 100,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "1.5rem",
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.4s ease" : "none",
        pointerEvents: phase === "exit" ? "none" : "all",
      }}
    >
      <style>{`
        @keyframes dot-drop {
          0%   { transform: translateY(-45vh) scale(0.5); opacity: 0; }
          10%  { opacity: 1; }
          55%  { transform: translateY(0) scale(1); }
          65%  { transform: translateY(-12px) scale(0.95); }
          75%  { transform: translateY(0) scale(1); }
          83%  { transform: translateY(-5px) scale(0.98); }
          90%  { transform: translateY(0) scale(1); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes word-in {
          0%   { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.9); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1);   }
        }
        @keyframes sub-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Yellow bouncing dot */}
      <div
        style={{
          width: 12, height: 12, borderRadius: "50%",
          background: "#FCD535",
          boxShadow: "0 0 20px 6px rgba(252,213,53,0.45)",
          animation: "dot-drop 1.6s cubic-bezier(0.22,1,0.36,1) forwards",
          willChange: "transform, opacity",
          flexShrink: 0,
        }}
      />

      {/* Text block — always rendered, opacity driven by currentWord */}
      <div style={{ position: "relative", height: "4rem", minWidth: "20ch", textAlign: "center" }}>
        {currentWord && (
          <span
            key={currentWord}
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              whiteSpace: "nowrap",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 6vw, 2.8rem)",
              letterSpacing: "0.2em",
              color: "#FCD535",
              animation: "word-in 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
              willChange: "opacity, transform",
            }}
          >
            {currentWord}
          </span>
        )}
      </div>

      {/* Sub-label */}
      <p
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.35em",
          color: "rgba(252,213,53,0.35)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          opacity: phase === "word3" ? 1 : 0,
          animation: phase === "word3" ? "sub-in 0.5s ease forwards" : "none",
        }}
      >
        OG KAAL TRADER — Admin
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown timer badge
// ─────────────────────────────────────────────────────────────────────────────
function CountdownBadge({ seconds }: { seconds: number }) {
  const urgent = seconds <= 10
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold"
      style={{
        background: urgent ? "rgba(239,68,68,0.1)" : "rgba(252,213,53,0.08)",
        borderColor: urgent ? "rgba(239,68,68,0.35)" : "rgba(252,213,53,0.25)",
        color: urgent ? "#f87171" : "#FCD535",
        transition: "all 0.4s ease",
        boxShadow: urgent ? "0 0 10px rgba(239,68,68,0.15)" : "none",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: urgent ? "#f87171" : "#FCD535",
          animation: urgent ? "pulse 0.8s ease-in-out infinite" : "pulse 2s ease-in-out infinite",
        }}
      />
      Admin Access Window: {seconds}s
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────
const ACCESS_WINDOW_SECONDS = 30

export function AdminLoginForm() {
  const router = useRouter()

  const [showIntro, setShowIntro]             = useState(true)
  const [secretKey, setSecretKey]             = useState("")
  const [error, setError]                     = useState("")
  const [isLoading, setIsLoading]             = useState(false)
  const [isChecking, setIsChecking]           = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [inputFocused, setInputFocused]       = useState(false)
  const [timeLeft, setTimeLeft]               = useState(ACCESS_WINDOW_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect when timer reaches 0 — must be in useEffect, never inside a setState updater
  useEffect(() => {
    if (timeLeft === 0) {
      router.push("/")
    }
  }, [timeLeft, router])

  // Start the 30s countdown only after the intro finishes
  const startTimer = useCallback(() => {
    if (timerRef.current) return // already started
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    setIsChecking(false)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [router])

  const handleIntroDone = useCallback(() => {
    setShowIntro(false)
    startTimer()
  }, [startTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRemainingAttempts(null)
    if (!secretKey.trim()) { setError("Enter the admin secret key"); return }

    setIsLoading(true)
    const r = await loginWithSecretKey(secretKey)

    if (r.success) {
      if (timerRef.current) clearInterval(timerRef.current)
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
      {showIntro && <BouncingDotIntro onDone={handleIntroDone} />}

      <div
        className="min-h-screen bg-black flex items-center justify-center p-4"
        style={{
          opacity: 1,
          // Form is always rendered; the intro overlay sits on top (z-index 100)
        }}
      >
        <Link
          href="/"
          className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Timer badge — top right */}
        {!showIntro && (
          <div className="fixed top-5 right-5">
            <CountdownBadge seconds={timeLeft} />
          </div>
        )}

        <div className="w-full max-w-sm">
          {/* Wordmark */}
          <div className="text-center mb-8 select-none">
            <div
              className="w-2 h-2 rounded-full bg-primary mx-auto mb-5"
              style={{ boxShadow: "0 0 18px 4px rgba(252,213,53,0.55)" }}
            />
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Admin Access</h1>
            <p className="text-xs text-neutral-500 mt-1.5 tracking-[0.2em] uppercase">OG KAAL TRADER — Restricted</p>
          </div>

          {/* Card */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl">

            {lock.locked && (
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
