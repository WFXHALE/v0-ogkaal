"use client"

import { useState } from "react"
import { X, Shield, ChevronDown } from "lucide-react"
import { signUp, signIn } from "@/lib/community-store"
import type { CommunityUser, TraderLevel } from "@/lib/community-utils"

export type AuthMode = "choose" | "signup" | "signin"

interface AuthModalProps {
  onClose: () => void
  onAuth: (user: CommunityUser) => void
  /** Optional initial mode — defaults to "choose" */
  initialMode?: AuthMode
  /** Text shown on the choose screen below the title */
  subtitle?: string
}

export function AuthModal({
  onClose,
  onAuth,
  initialMode = "choose",
  subtitle = "Sign in to post, like, and comment.",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [form, setForm] = useState({
    fullName:   "",
    email:      "",
    phone:      "",
    level:      "Beginner" as TraderLevel,
    identifier: "",
  })
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSignUp() {
    if (!form.fullName || !form.email || !form.phone) { setError("All fields required."); return }
    setLoading(true); setError("")
    const res = await signUp({ fullName: form.fullName, email: form.email, phone: form.phone, level: form.level })
    setLoading(false)
    if (!res.ok) { setError(res.error || "Something went wrong. Please try again."); return }
    onAuth(res.user!)
  }

  async function handleSignIn() {
    if (!form.identifier) { setError("Enter your email or phone number."); return }
    setLoading(true); setError("")
    const res = await signIn(form.identifier)
    setLoading(false)
    if (!res.ok) { setError(res.error || "Account not found."); return }
    onAuth(res.user!)
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
  const primaryBtn =
    "w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-50"
  const secondaryBtn =
    "w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-semibold hover:bg-secondary/80 transition-colors"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Choose screen ─────────────────────────────────────────────── */}
        {mode === "choose" && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Join the Community</h2>
            <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
            <div className="space-y-3">
              <button onClick={() => setMode("signup")} className={primaryBtn}>
                Create Account
              </button>
              <button onClick={() => setMode("signin")} className={secondaryBtn}>
                Sign In
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue as Anonymous Viewer
              </button>
            </div>
          </div>
        )}

        {/* ── Sign Up screen ────────────────────────────────────────────── */}
        {mode === "signup" && (
          <div>
            <button
              onClick={() => { setMode("choose"); setError("") }}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">Create Account</h2>
            <div className="space-y-3">
              <input
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Full Name"
                className={inputCls}
              />
              <input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Email"
                type="email"
                className={inputCls}
              />
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="Phone Number"
                type="tel"
                className={inputCls}
              />
              <div className="relative">
                <select
                  value={form.level}
                  onChange={(e) => set("level", e.target.value)}
                  className={inputCls + " appearance-none"}
                >
                  {(["Beginner", "Trader", "Pro Trader", "Master Trader"] as TraderLevel[]).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSignUp} disabled={loading} className={primaryBtn}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </div>
        )}

        {/* ── Sign In screen ────────────────────────────────────────────── */}
        {mode === "signin" && (
          <div>
            <button
              onClick={() => { setMode("choose"); setError("") }}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">Sign In</h2>
            <div className="space-y-3">
              <input
                value={form.identifier}
                onChange={(e) => set("identifier", e.target.value)}
                placeholder="Email or Phone Number"
                className={inputCls}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSignIn} disabled={loading} className={primaryBtn}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
              <button
                onClick={() => { setMode("signup"); setError("") }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                No account? Create one
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
