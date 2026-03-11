"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─────────────────────────────────────────────────────────────────────────────
// Countdown timer badge
// ─────────────────────────────────────────────────────────────────────────────
function CountdownBadge({ seconds }: { seconds: number }) {
  const urgent = seconds <= 10
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold"
      style={{
        background:  urgent ? "rgba(239,68,68,0.1)"          : "rgba(252,213,53,0.08)",
        borderColor: urgent ? "rgba(239,68,68,0.35)"         : "rgba(252,213,53,0.25)",
        color:       urgent ? "#f87171"                      : "#FCD535",
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
// Main form — no intro animation, renders instantly
// ─────────────────────────────────────────────────────────────────────────────
const ACCESS_WINDOW_SECONDS = 30

export function AdminLoginForm() {
  const router = useRouter()

  const [secretKey, setSecretKey]                 = useState("")
  const [error, setError]                         = useState("")
  const [isLoading, setIsLoading]                 = useState(false)
  const [isChecking, setIsChecking]               = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [inputFocused, setInputFocused]           = useState(false)
  const [timeLeft, setTimeLeft]                   = useState(ACCESS_WINDOW_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) return
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
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [router, startTimer])

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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="fixed top-5 right-5">
        <CountdownBadge seconds={timeLeft} />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8 select-none">
          <div
            className="w-2 h-2 rounded-full bg-primary mx-auto mb-5"
            style={{ boxShadow: "0 0 18px 4px rgba(252,213,53,0.55)" }}
          />
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Admin Access</h1>
          <p className="text-xs text-neutral-500 mt-1.5 tracking-[0.2em] uppercase">OG KAAL TRADER — Restricted</p>
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
                  autoFocus
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
              {isLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Verifying...</>
                : "Unlock Admin Panel"
              }
            </Button>
          </form>

          <p className="text-xs text-neutral-600 text-center mt-4">
            5 attempts max — failed attempts trigger a 24-hour lockout.
          </p>
        </div>
      </div>
    </div>
  )
}
