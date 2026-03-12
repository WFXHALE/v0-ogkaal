"use client"

import { useState } from "react"
import { X, Shield, ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react"
import { firebaseSignUp, firebaseSignIn, firebaseSignInWithGoogle } from "@/lib/firebase-auth"
import type { CommunityUser, TraderLevel } from "@/lib/community-utils"

export type AuthMode = "choose" | "signup" | "signin"

interface AuthModalProps {
  onClose: () => void
  onAuth: (user: CommunityUser) => void
  initialMode?: AuthMode
  subtitle?: string
}

// Google G icon as inline SVG
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
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
    password:   "",
    phone:      "",
    level:      "Beginner" as TraderLevel,
  })
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const back = () => { setMode("choose"); setError("") }

  async function handleSignUp() {
    if (!form.fullName || !form.email || !form.password || !form.phone) {
      setError("All fields are required.")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true); setError("")
    const res = await firebaseSignUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      phone:    form.phone,
      level:    form.level,
    })
    setLoading(false)
    if (!res.ok) { setError(res.error!); return }
    onAuth(res.user!)
  }

  async function handleSignIn() {
    if (!form.email || !form.password) {
      setError("Please enter your email and password.")
      return
    }
    setLoading(true); setError("")
    const res = await firebaseSignIn({ email: form.email, password: form.password })
    setLoading(false)
    if (!res.ok) { setError(res.error!); return }
    onAuth(res.user!)
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError("")
    const res = await firebaseSignInWithGoogle()
    setGoogleLoading(false)
    if (!res.ok) {
      // Cancelled popup — don't show an error
      if (res.error !== "Sign-in cancelled.") setError(res.error!)
      return
    }
    onAuth(res.user!)
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
  const primaryBtn =
    "w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
  const secondaryBtn =
    "w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"

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

        {/* ── Divider helper ───────────────────────────────────────────── */}
        {(mode === "signup" || mode === "signin") && (
          <div />
        )}

        {/* ── Choose screen ────────────────────────────────────────────── */}
        {mode === "choose" && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Join the Community</h2>
            <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>

            <div className="space-y-3">
              <button onClick={handleGoogle} disabled={googleLoading} className={secondaryBtn}>
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <div className="flex-1 h-px bg-border" />
                <span>or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button onClick={() => setMode("signup")} className={primaryBtn}>
                Create Account with Email
              </button>
              <button onClick={() => setMode("signin")} className={secondaryBtn}>
                Sign In with Email
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue as Anonymous Viewer
              </button>

              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
          </div>
        )}

        {/* ── Sign Up screen ───────────────────────────────────────────── */}
        {mode === "signup" && (
          <div>
            <button onClick={back} className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">Create Account</h2>

            {/* Google option at top of sign-up too */}
            <button onClick={handleGoogle} disabled={googleLoading} className={secondaryBtn + " mb-4"}>
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Sign up with Google
            </button>
            <div className="flex items-center gap-3 text-muted-foreground text-xs mb-4">
              <div className="flex-1 h-px bg-border" />
              <span>or with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3">
              <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Full Name" className={inputCls} />
              <input value={form.email}    onChange={(e) => set("email", e.target.value)}    placeholder="Email" type="email" className={inputCls} />
              <div className="relative">
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  type={showPw ? "text" : "password"}
                  className={inputCls + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone Number" type="tel" className={inputCls} />
              <div className="relative">
                <select value={form.level} onChange={(e) => set("level", e.target.value)} className={inputCls + " appearance-none"}>
                  {(["Beginner", "Trader", "Pro Trader", "Master Trader"] as TraderLevel[]).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSignUp} disabled={loading} className={primaryBtn}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : "Create Account"}
              </button>
            </div>
          </div>
        )}

        {/* ── Sign In screen ───────────────────────────────────────────── */}
        {mode === "signin" && (
          <div>
            <button onClick={back} className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">Sign In</h2>

            <button onClick={handleGoogle} disabled={googleLoading} className={secondaryBtn + " mb-4"}>
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Sign in with Google
            </button>
            <div className="flex items-center gap-3 text-muted-foreground text-xs mb-4">
              <div className="flex-1 h-px bg-border" />
              <span>or with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3">
              <input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Email"
                type="email"
                className={inputCls}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
              <div className="relative">
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Password"
                  type={showPw ? "text" : "password"}
                  className={inputCls + " pr-11"}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSignIn} disabled={loading} className={primaryBtn}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : "Sign In"}
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
