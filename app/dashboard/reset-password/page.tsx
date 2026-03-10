"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, KeyRound, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { resetPasswordWithToken } from "@/lib/dash-auth"
import { BackButton } from "@/components/back-button"

function ResetPasswordForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const token       = params.get("token") ?? ""

  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState("")

  useEffect(() => {
    if (!token) setError("Missing or invalid reset link. Please request a new one.")
  }, [token])

  const rules = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    match:   password === confirm && confirm.length > 0,
  }
  const valid = Object.values(rules).every(Boolean)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !token) return
    setLoading(true); setError("")
    const res = await resetPasswordWithToken(token, password)
    setLoading(false)
    if (!res.success) { setError(res.error ?? "Something went wrong."); return }
    setDone(true)
    setTimeout(() => router.replace("/dashboard"), 3000)
  }

  return (
    <>
    <div className="fixed top-0 left-0 right-0 z-40"><BackButton /></div>
    <main className="min-h-screen flex items-center justify-center bg-background px-4 pt-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-foreground tracking-tight">OG Kaal</p>
          <p className="text-sm text-muted-foreground mt-1">Client Dashboard</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Password updated!</p>
                <p className="text-sm text-muted-foreground mt-1">Redirecting you to the dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Set new password</p>
                  <p className="text-xs text-muted-foreground">Choose a strong password for your account</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
                  <XCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm Password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Password rules */}
                {password.length > 0 && (
                  <ul className="space-y-1.5 px-1">
                    {[
                      { ok: rules.length,  label: "At least 8 characters" },
                      { ok: rules.upper,   label: "Contains uppercase letter" },
                      { ok: rules.number,  label: "Contains a number" },
                      { ok: rules.match,   label: "Passwords match" },
                    ].map(r => (
                      <li key={r.label} className={`flex items-center gap-2 text-xs transition-colors ${r.ok ? "text-green-400" : "text-muted-foreground"}`}>
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 transition-opacity ${r.ok ? "opacity-100" : "opacity-30"}`} />
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="submit"
                  disabled={!valid || loading || !token}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
