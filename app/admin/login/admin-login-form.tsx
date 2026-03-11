"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Lock,
  Shield,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  KeyRound,
} from "lucide-react"
import {
  loginWithSecretKey,
  isSessionValid,
  isAccountLocked,
} from "@/lib/admin-auth"

export function AdminLoginForm() {
  const router = useRouter()

  const [secretKey, setSecretKey]   = useState("")
  const [error, setError]           = useState("")
  const [isLoading, setIsLoading]   = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    setIsChecking(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRemainingAttempts(null)

    if (!secretKey.trim()) {
      setError("Enter the admin secret key")
      return
    }

    setIsLoading(true)
    const r = await loginWithSecretKey(secretKey)
    
    if (r.success) {
      router.push("/admin")
    } else {
      setError(r.error || "Invalid Key – Access Denied")
      if (r.attemptsRemaining !== undefined) {
        setRemainingAttempts(r.attemptsRemaining)
      }
    }
    
    setIsLoading(false)
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  const lock = isAccountLocked()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">OG KAAL TRADER — Restricted Access</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-xs text-red-400/70 mt-1">
                    {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining before 24-hour lockout
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Lockout Warning */}
          {lock.locked && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
              <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-semibold">Account Locked</p>
                <p className="text-xs text-red-400/70 mt-0.5">
                  Too many failed attempts. Access blocked for {Math.ceil((lock.remainingSeconds || 0) / 3600)} hours.
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Enter Admin Secret Key 🔑
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={secretKey}
                  onChange={e => setSecretKey(e.target.value)}
                  placeholder="Enter secret key"
                  autoComplete="off"
                  disabled={lock.locked}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || lock.locked}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Unlock Admin Panel
                </>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Security Notice:</strong> Maximum 5 login attempts per day. 
              After 5 failed attempts, access will be blocked for 24 hours.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  )
}
