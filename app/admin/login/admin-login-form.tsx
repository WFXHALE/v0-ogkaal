"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─────────────────────────────────────────────────────────────────────────────
// Bouncing dot intro animation
// Dot drops → OG → KAAL → WELCOME KAAL → fade out → show form
// All motion uses translateY / scaleY (compositor-only, 60fps)
// Hard fallback: form always shows after 3.2s no matter what
// ─────────────────────────────────────────────────────────────────────────────
type IntroPhase = "drop1" | "og" | "drop2" | "kaal" | "drop3" | "welcome" | "exit"

function BounceDotIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<IntroPhase>("drop1")
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase("exit")
    // Small delay so exit fade plays, then unmount
    setTimeout(onDone, 350)
  }, [onDone])

  useEffect(() => {
    // Hard safety — never block form longer than 3.2s
    const safety = setTimeout(finish, 3200)

    // Sequence timing
    const t1 = setTimeout(() => setPhase("og"),      650)  // dot lands → show OG
    const t2 = setTimeout(() => setPhase("drop2"),   1050) // brief pause then bounce
    const t3 = setTimeout(() => setPhase("kaal"),    1500) // lands → show KAAL
    const t4 = setTimeout(() => setPhase("drop3"),   1850) // bounce again
    const t5 = setTimeout(() => setPhase("welcome"), 2250) // lands → WELCOME KAAL
    const t6 = setTimeout(finish,                    2900) // exit

    return () => {
      clearTimeout(safety)
      ;[t1,t2,t3,t4,t5,t6].forEach(clearTimeout)
    }
  }, [finish])

  const showDot     = phase !== "og" && phase !== "kaal" && phase !== "welcome"
  const showOG      = phase === "og" || phase === "drop2"
  const showKAAL    = phase === "kaal" || phase === "drop3"
  const showWelcome = phase === "welcome" || phase === "exit"

  const dotAnim =
    phase === "drop1" ? "dot-fall 1.1s cubic-bezier(0.22,1,0.36,1) forwards" :
    phase === "drop2" || phase === "drop3" ? "dot-bounce-2 0.55s cubic-bezier(0.22,1,0.36,1) forwards" :
    "none"

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "1.25rem",
        animation: phase === "exit" ? "intro-fade-out 0.35s ease forwards" : "none",
        pointerEvents: phase === "exit" ? "none" : "all",
      }}
    >
      {/* Dot */}
      {showDot && (
        <div
          key={phase === "drop1" ? "d1" : phase === "drop2" ? "d2" : "d3"}
          style={{
            width: 10, height: 10,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 0 14px 4px rgba(255,255,255,0.4)",
            willChange: "transform",
            animation: dotAnim,
            transformOrigin: "center bottom",
          }}
        />
      )}

      {/* Text area — fixed height so layout doesn't jump */}
      <div style={{ position: "relative", height: "6rem", width: "100%", textAlign: "center" }}>
        {showOG && (
          <span
            key="og"
            style={{
              position: "absolute", left: "50%", top: 0,
              transform: "translateX(-50%)",
              fontFamily: "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
              fontSize: "clamp(3rem, 14vw, 5.5rem)",
              fontWeight: 400,
              letterSpacing: "0.15em",
              color: "#fff",
              whiteSpace: "nowrap",
              animation: "word-reveal 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
              willChange: "opacity, transform, filter",
            }}
          >
            OG
          </span>
        )}

        {showKAAL && (
          <span
            key="kaal"
            style={{
              position: "absolute", left: "50%", top: 0,
              transform: "translateX(-50%)",
              fontFamily: "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
              fontSize: "clamp(3rem, 14vw, 5.5rem)",
              fontWeight: 400,
              letterSpacing: "0.15em",
              color: "#fff",
              whiteSpace: "nowrap",
              animation: "word-reveal 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
              willChange: "opacity, transform, filter",
            }}
          >
            OG KAAL
          </span>
        )}

        {showWelcome && (
          <span
            key="welcome"
            style={{
              position: "absolute", left: "50%", top: 0,
              transform: "translateX(-50%)",
              fontFamily: "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
              fontSize: "clamp(2.4rem, 10vw, 4.2rem)",
              fontWeight: 400,
              letterSpacing: "0.15em",
              color: "#FCD535",
              whiteSpace: "nowrap",
              animation: "word-reveal 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
              willChange: "opacity, transform, filter",
            }}
          >
            WELCOME KAAL
          </span>
        )}
      </div>

      {/* Sub-label fades in only on final word */}
      <p
        style={{
          fontFamily: "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
          fontSize: "0.62rem",
          letterSpacing: "0.4em",
          color: "rgba(252,213,53,0.3)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          opacity: showWelcome ? 1 : 0,
          transition: "opacity 0.5s ease 0.15s",
        }}
      >
        OG KAAL TRADER — Admin Portal
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown badge
// ─────────────────────────────────────────────────────────────────────────────
function CountdownBadge({ seconds }: { seconds: number }) {
  const urgent = seconds <= 10
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold"
      style={{
        background:  urgent ? "rgba(239,68,68,0.1)"           : "rgba(252,213,53,0.08)",
        borderColor: urgent ? "rgba(239,68,68,0.35)"          : "rgba(252,213,53,0.25)",
        color:       urgent ? "#f87171"                       : "#FCD535",
        transition:  "all 0.4s ease",
        boxShadow:   urgent ? "0 0 10px rgba(239,68,68,0.15)" : "none",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: urgent ? "#f87171" : "#FCD535",
          animation:  urgent ? "pulse 0.8s ease-in-out infinite" : "pulse 2s ease-in-out infinite",
        }}
      />
      Access Window: {seconds}s
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────
const ACCESS_WINDOW_SECONDS = 30

export function AdminLoginForm() {
  const router = useRouter()

  const [showIntro, setShowIntro]                 = useState(true)
  const [secretKey, setSecretKey]                 = useState("")
  const [error, setError]                         = useState("")
  const [isLoading, setIsLoading]                 = useState(false)
  const [isChecking, setIsChecking]               = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [inputFocused, setInputFocused]           = useState(false)
  const [timeLeft, setTimeLeft]                   = useState(ACCESS_WINDOW_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect when timer hits 0 — must live in useEffect, never inside setState updater
  useEffect(() => {
    if (timeLeft === 0) router.push("/")
  }, [timeLeft, router])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? (clearInterval(timerRef.current!), 0) : t - 1))
    }, 1000)
  }, [])

  // Session check on mount
  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    setIsChecking(false)
  }, [router])

  // Start timer once intro finishes
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
        <RefreshCw className="w-4 h-4 text-primary animate-spin" />
      </div>
    )
  }

  const lock = isAccountLocked()

  return (
    <>
      {/* Bouncing dot intro — sits on top, unmounts after animation */}
      {showIntro && <BounceDotIntro onDone={handleIntroDone} />}

      {/* Login form — always rendered behind intro (never blank) */}
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Link
          href="/"
          className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {!showIntro && (
          <div className="fixed top-5 right-5">
            <CountdownBadge seconds={timeLeft} />
          </div>
        )}

        <div className="w-full max-w-sm">
          <div className="text-center mb-8 select-none">
            <div
              className="w-2 h-2 rounded-full bg-primary mx-auto mb-5"
              style={{ boxShadow: "0 0 18px 4px rgba(252,213,53,0.55)" }}
            />
            <h1 className="text-3xl font-bold text-white tracking-widest uppercase">Admin Access</h1>
            <p className="text-xs text-neutral-500 mt-1.5 tracking-[0.25em] uppercase">OG KAAL TRADER — Restricted</p>
          </div>

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
                    boxShadow: inputFocused
                      ? "0 0 0 2px rgba(252,213,53,0.35), 0 0 16px rgba(252,213,53,0.15)"
                      : "none",
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
                    autoFocus={!showIntro}
                    disabled={lock.locked || isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-600 focus:outline-none text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || lock.locked}
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-5 tracking-widest uppercase"
              >
                {isLoading
                  ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Verifying...</>
                  : "Unlock Admin Panel"
                }
              </Button>
            </form>

            <p className="text-xs text-neutral-600 text-center mt-4 tracking-wide">
              5 attempts max — failed attempts trigger a 24-hour lockout
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
