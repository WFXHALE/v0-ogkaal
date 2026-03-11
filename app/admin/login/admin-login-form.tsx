"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ─────────────────────────────────────────────────────────────────────────────
// Admin login — secret key only
// No loading animations. Form renders immediately.
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLoginForm() {
  const router = useRouter()

  const [secretKey, setSecretKey]                 = useState("")
  const [error, setError]                         = useState("")
  const [isLoading, setIsLoading]                 = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [showKey, setShowKey]                     = useState(false)

  // Session check — client-only, never during SSR to avoid hydration mismatch
  useEffect(() => {
    if (isSessionValid()) {
      router.replace("/admin")
    }
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

      {/* Back link */}
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Card */}
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
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              type={showKey ? "text" : "password"}
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              placeholder="Enter admin secret key"
              autoFocus
              autoComplete="current-password"
              disabled={lock.locked || isLoading}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-12 py-3.5 text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-[#FCD535]/60 focus:ring-1 focus:ring-[#FCD535]/30 transition-colors disabled:opacity-50"
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

          {/* Error */}
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
