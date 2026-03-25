"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Shield, Lock, Eye, EyeOff, AlertCircle, RefreshCw, Timer } from "lucide-react"
import AdminPanel from "@/app/admin/admin-panel"
import { loginWithSecretKey, isSessionValid, checkLockoutStatus } from "@/lib/admin-auth"

/**
 * Admin entry point — secret key gate with DB-backed progressive lockout.
 *
 * Lockout schedule (server-enforced, tracked per IP):
 *   3 failures  →  5 min   |  7 failures  →  1 hour   |  15 failures  → 24 hours
 *   5 failures  → 15 min   | 10 failures  →  6 hours  |  20+ failures →  7 days
 *
 * The client only renders a countdown; all lockout state lives in the DB.
 */
export default function KaalAdminConsole() {
  const [phase, setPhase]             = useState<"loading" | "key-gate" | "locked" | "panel">("loading")
  const [keyInput, setKeyInput]       = useState("")
  const [showKey, setShowKey]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [failureCount, setFailureCount] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  // Lockout countdown
  const [lockedUntil, setLockedUntil]   = useState<Date | null>(null)
  const [countdown, setCountdown]       = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Format seconds → human-readable ───────────────────────────────────────
  const formatCountdown = (sec: number): string => {
    if (sec <= 0) return "0s"
    const d = Math.floor(sec / 86400)
    const h = Math.floor((sec % 86400) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  // ── Live countdown tick ────────────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining <= 0) {
        setLockedUntil(null)
        setPhase("key-gate")
        setError(null)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  // ── Check session + lockout status on mount ────────────────────────────────
  const checkStatus = useCallback(async () => {
    if (isSessionValid()) {
      setPhase("panel")
      return
    }
    const status = await checkLockoutStatus()
    setFailureCount(status.failureCount)
    setAttemptsLeft(status.attemptsLeft)
    if (status.locked && status.remainingSec > 0) {
      setLockedUntil(new Date(Date.now() + status.remainingSec * 1000))
      setCountdown(status.remainingSec)
      setPhase("locked")
    } else {
      setPhase("key-gate")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyInput.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    const result = await loginWithSecretKey(keyInput.trim())
    setSubmitting(false)

    if (result.success) {
      setPhase("panel")
      return
    }

    setKeyInput("")

    if (result.locked && result.remainingSec && result.remainingSec > 0) {
      setLockedUntil(new Date(Date.now() + result.remainingSec * 1000))
      setCountdown(result.remainingSec)
      setFailureCount(result.failureCount ?? 0)
      setPhase("locked")
      return
    }

    setFailureCount(result.failureCount ?? 0)
    setAttemptsLeft(result.attemptsLeft ?? 0)
    setError(result.error ?? "Invalid key — access denied.")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  // ── Authenticated — show panel ─────────────────────────────────────────────
  if (phase === "panel") return <AdminPanel />

  // ── Locked out — countdown screen ─────────────────────────────────────────
  if (phase === "locked") {
    const lockDurationLabel = (() => {
      if (countdown > 86400) return "7 days"
      if (countdown > 21600) return "24 hours"
      if (countdown > 3600)  return "6 hours"
      if (countdown > 900)   return "1 hour"
      if (countdown > 300)   return "15 minutes"
      return "5 minutes"
    })()

    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground tracking-tight">Access Locked</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Too many failed attempts. Locked for {lockDurationLabel}.
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl bg-red-500/5 border border-red-500/15 p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Unlocks in</span>
            </div>
            <p className="text-4xl font-mono font-bold text-red-400 tabular-nums">
              {formatCountdown(countdown)}
            </p>
          </div>

          <div className="rounded-xl bg-secondary border border-border p-4 space-y-1.5 text-xs text-muted-foreground">
            <p className="flex justify-between"><span>Failed attempts</span><span className="text-foreground font-semibold">{failureCount}</span></p>
            <p className="flex justify-between"><span>Lockout triggered at</span><span className="text-foreground font-semibold">{failureCount} failures</span></p>
            <p className="flex justify-between"><span>Next attempt allowed</span><span className="text-foreground font-semibold">{formatCountdown(countdown)}</span></p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Suspicious activity has been logged. This event will be reported if attempts continue.
          </p>
        </div>
      </div>
    )
  }

  // ── Key gate ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your secret key to continue</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={e => { setKeyInput(e.target.value); setError(null) }}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(e as unknown as React.FormEvent) }}
              placeholder="Secret key"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !keyInput.trim()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
              : "Verify Key"
            }
          </button>
        </form>

        {/* Attempts warning */}
        {failureCount > 0 && (
          <div className="mt-6 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
            <p className="text-xs text-amber-400 text-center">
              {failureCount} failed {failureCount === 1 ? "attempt" : "attempts"}.
              {attemptsLeft > 0
                ? ` ${attemptsLeft} more ${attemptsLeft === 1 ? "attempt" : "attempts"} before lockout.`
                : " Next failure will trigger lockout."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
