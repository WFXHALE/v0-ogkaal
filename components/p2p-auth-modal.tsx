"use client"
import { useState } from "react"
import { X, Eye, EyeOff, Loader2 } from "lucide-react"
import { p2pSignIn, p2pSignInWithGoogle, p2pSignUp } from "@/lib/p2p-auth"
import type { CommunityUser, TraderLevel } from "@/lib/community-utils"

type Mode = "choose" | "signup" | "signin"
export function P2PAuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (user: CommunityUser) => void }) {
  const [mode, setMode] = useState<Mode>("choose")
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", level: "Beginner" as TraderLevel })
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
  const buttonClass = "w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50"
  async function submit() {
    setError(""); setNotice("")
    if (!form.email.trim() || !form.password || (mode === "signup" && (!form.fullName.trim() || !form.phone.trim()))) { setError("Complete all required fields."); return }
    if (mode === "signup" && form.password.length < 8) { setError("Use a password with at least 8 characters."); return }
    setLoading(true)
    const result = mode === "signup" ? await p2pSignUp(form) : await p2pSignIn({ email: form.email, password: form.password })
    setLoading(false)
    if (!result.ok) { setError(result.error); return }
    if (result.confirmationRequired) { setNotice("Check your email and confirm your address. Then return here and sign in."); return }
    if (result.user) onAuth(result.user)
  }
  async function google() {
    setError(""); setLoading(true)
    const result = await p2pSignInWithGoogle()
    setLoading(false)
    if (!result.ok) setError(result.error)
  }
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm">
    <div className="relative my-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-muted-foreground"><X className="h-5 w-5" /></button>
      <h2 className="mb-2 pr-8 text-xl font-bold text-foreground">{mode === "signup" ? "Create P2P Account" : mode === "signin" ? "Sign In to P2P" : "P2P Account Required"}</h2>
      <p className="mb-5 text-sm text-muted-foreground">Sign in or create an account to buy or sell USDT and view your transaction history.</p>
      {mode === "choose" ? <div className="space-y-3">
        <button onClick={google} disabled={loading} className={inputClass + " flex items-center justify-center gap-2 font-semibold"}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "G"} Continue with Google</button>
        <button onClick={() => setMode("signup")} className={buttonClass}>Create Account with Email</button>
        <button onClick={() => setMode("signin")} className={inputClass + " font-semibold"}>Sign In with Email</button>
      </div> : <div className="space-y-3">
        <button onClick={() => { setMode("choose"); setError(""); setNotice("") }} className="text-sm text-muted-foreground">← Back</button>
        {mode === "signup" && <>
          <input value={form.fullName} onChange={e => update("fullName", e.target.value)} placeholder="Full name" className={inputClass} autoComplete="name" />
          <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Phone number" type="tel" className={inputClass} autoComplete="tel" />
        </>}
        <input value={form.email} onChange={e => update("email", e.target.value)} placeholder="Email address" type="email" className={inputClass} autoComplete="email" />
        <div className="relative">
          <input value={form.password} onChange={e => update("password", e.target.value)} placeholder="Password (minimum 8 characters)" type={showPassword ? "text" : "password"} className={inputClass + " pr-12"} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3.5 text-muted-foreground" aria-label="Toggle password visibility">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        {mode === "signup" && <select value={form.level} onChange={e => update("level", e.target.value)} className={inputClass}>{(["Beginner","Trader","Pro Trader","Master Trader"] as TraderLevel[]).map(level => <option key={level}>{level}</option>)}</select>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}
        <button onClick={submit} disabled={loading} className={buttonClass}>{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : mode === "signup" ? "Create Account" : "Sign In"}</button>
        <button onClick={google} disabled={loading} className={inputClass + " font-semibold"}>Continue with Google</button>
        <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setNotice("") }} className="w-full py-2 text-sm text-muted-foreground">{mode === "signup" ? "Already have an account? Sign in" : "New to P2P? Create an account"}</button>
      </div>}
    </div>
  </div>
}
