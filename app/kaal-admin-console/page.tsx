"use client"

import { useState, useEffect, useRef } from "react"
import { Shield, Lock, Eye, EyeOff, AlertCircle, RefreshCw } from "lucide-react"
import AdminPanel from "@/app/admin/admin-panel"
import { loginWithSecretKey, isSessionValid } from "@/lib/admin-auth"

const SESSION_KEY = "og_admin_key_verified"

/**
 * Admin entry point — hidden page triggered by clicking the logo 5 times.
 *
 * Flow:
 *   1. If a valid admin session exists → show AdminPanel directly.
 *   2. Otherwise → show Secret Key prompt.
 *   3. On correct key → verify server-side → show AdminPanel + persist session.
 *
 * The secret key is stored only as ADMIN_SECRET_KEY on the server (env var).
 * It is never sent to the client — verification happens via POST /api/admin/verify-key.
 */
export default function KaalAdminConsole() {
  const [phase, setPhase]           = useState<"loading" | "key-gate" | "panel">("loading")
  const [keyInput, setKeyInput]     = useState("")
  const [showKey, setShowKey]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempts, setAttempts]     = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // If there is already a valid admin session (from a previous login), go straight to the panel
    if (isSessionValid()) {
      setPhase("panel")
    } else {
      setPhase("key-gate")
      // Small delay so the input is in the DOM before we focus
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyInput.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    const result = await loginWithSecretKey(keyInput.trim())

    setSubmitting(false)

    if (result.success) {
      setPhase("panel")
    } else {
      setAttempts(a => a + 1)
      setError(result.error ?? "Invalid key — access denied.")
      setKeyInput("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (phase === "panel") {
    return <AdminPanel />
  }

  // ── Secret Key Gate ──────────────────────────────────────────────────────────
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
              <p className="text-xs text-red-400">{error}</p>
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

        {attempts > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {attempts} failed {attempts === 1 ? "attempt" : "attempts"} — account will be locked after 5 failures.
          </p>
        )}
      </div>
    </div>
  )
}
