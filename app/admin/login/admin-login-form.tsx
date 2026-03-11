"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─────────────────────────────────────────────────────────────────────────────
// Bouncing-dot-writes-text intro animation
// The dot drops from top, bounces, and each bounce "types" a word.
// After 3 bounces: WELCOME → KAAL → WELCOME KAAL (overwrite)
// Total runtime: 2.6s, then fades out in 0.4s.
// ─────────────────────────────────────────────────────────────────────────────
function BouncingDotIntro({ onDone }: { onDone: () => void }) {
  const [word, setWord] = useState("")
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    // Sequence: drop → WELCOME (0.7s), bounce → KAAL (1.3s), bounce → WELCOME KAAL (1.9s), fade (2.6s)
    const t1 = setTimeout(() => setWord("WELCOME"),      700)
    const t2 = setTimeout(() => setWord("KAAL"),         1300)
    const t3 = setTimeout(() => setWord("WELCOME KAAL"), 1900)
    const t4 = setTimeout(onDone, 3000)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", animation: "intro-exit 0.4s ease forwards 2.6s", willChange: "opacity" }}>
      <style>{`
        /* ── Initial drop from top ── */
        @keyframes dot-initial-drop {
          0%   { top: 2vh;  opacity: 0; }
          8%   { opacity: 1; }
          40%  { top: 50vh; }
          55%  { top: 45vh; }   /* first bounce */
          70%  { top: 50vh; }
          80%  { top: 47vh; }   /* second bounce */
          90%  { top: 50vh; }
          95%  { top: 48.5vh; } /* third mini bounce */
          100% { top: 50vh; }
        }

        /* ── Each text swap: flash in ── */
        @keyframes word-pop {
          0%   { opacity: 0; transform: scale(0.88) translateY(4px); }
          60%  { opacity: 1; transform: scale(1.04) translateY(0); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }

        /* ── Screen exit ── */
        @keyframes intro-exit {
          to { opacity: 0; pointer-events: none; }
        }

        .dot-intro {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #FCD535;
          box-shadow: 0 0 18px 5px rgba(252,213,53,0.4);
          animation: dot-initial-drop 2.0s cubic-bezier(0.22,1,0.36,1) forwards;
          will-change: top, opacity;
        }

        .word-display {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translateX(-50%) translateY(-50%);
          white-space: nowrap;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 7vw, 3.2rem);
          letter-spacing: 0.22em;
          color: #FCD535;
          animation: word-pop 0.25s cubic-bezier(0.22,1,0.36,1) forwards;
          will-change: opacity, transform;
        }

        .sub-line {
          position: absolute;
          left: 50%;
          top: calc(50% + clamp(2.4rem, 7vw + 0.5rem, 4.4rem));
          transform: translateX(-50%);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: clamp(0.55rem, 1.8vw, 0.72rem);
          font-weight: 500;
          letter-spacing: 0.35em;
          color: rgba(252,213,53,0.35);
          text-transform: uppercase;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .sub-line.visible { opacity: 1; }
      `}</style>

      <div className="dot-intro" />

      {word && (
        <span key={word} className="word-display">{word}</span>
      )}

      <span className={`sub-line ${word === "WELCOME KAAL" ? "visible" : ""}`}>
        OG KAAL TRADER — Admin
      </span>
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

  // Start the 30s countdown only after the intro finishes
  const startTimer = useCallback(() => {
    if (timerRef.current) return // already started
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          router.push("/")
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [router])

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
          opacity: showIntro ? 0 : 1,
          transition: "opacity 0.5s ease",
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
