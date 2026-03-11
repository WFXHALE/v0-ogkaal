"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  User, Crown, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, CreditCard, LogOut, ArrowRight, Shield,
  Copy, Check, ChevronDown, ChevronUp,
  Eye, EyeOff, RefreshCw, KeyRound, Mail, Lock,
  Bell, Link2, MessageCircle, BarChart2, BookOpen,
  Star, Users, Activity, TrendingUp,
} from "lucide-react"
import {
  getSession, logout,
  login, loginWithBackupCode, registerDashboardUser,
  sendPasswordResetOtp, verifyOtpAndResetPassword,
  storeBackupCode, getStoredBackupCode, fetchBackupCode,
} from "@/lib/dash-auth"
import type { DashboardSession } from "@/lib/dash-auth"
import { signInWithGoogle } from "@/lib/google-auth"
import { getVipSignals, getPerformanceStats } from "@/lib/membership-store"
import type { VipSignal, PerformanceStat } from "@/lib/membership-store"
import { BackButton } from "@/components/back-button"
import { createClient } from "@/lib/supabase/client"
import { PushNotificationBell } from "@/components/push-notification-bell"
import { NotificationSettingsPanel } from "@/components/notification-settings-panel"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function daysLeft(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:   "bg-green-500/10 text-green-400 border-green-500/30",
    pending:  "bg-amber-500/10 text-amber-400 border-amber-500/30",
    expired:  "bg-red-500/10 text-red-400 border-red-500/30",
    approved: "bg-green-500/10 text-green-400 border-green-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  }
  const Icon = status === "active" || status === "approved" ? CheckCircle
    : status === "expired" || status === "rejected" ? XCircle : AlertCircle
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium capitalize ${map[status] ?? "bg-secondary text-muted-foreground border-border"}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  )
}

function Card({
  title, icon, children, defaultOpen = true, badge,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-foreground text-sm">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  )
}

// ── Auth Screen ───────────────────────────────────────────────────────────────

type AuthMode = "login" | "register" | "backup" | "forgot" | "forgot_otp" | "forgot_reset" | "backup_shown"

function AuthScreen({
  onAuth,
  onBackupCode,
}: {
  onAuth: (s: DashboardSession) => void
  onBackupCode: (code: string) => void
}) {
  const [mode, setMode]                   = useState<AuthMode>("login")
  const [showPw, setShowPw]               = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState("")
  const [success, setSuccess]             = useState("")
  const [generatedBackup, setGeneratedBackup] = useState("")
  const [backupCopied, setBackupCopied]   = useState(false)
  const [loginId, setLoginId]             = useState("")
  const [loginPw, setLoginPw]             = useState("")
  const [regId, setRegId]                       = useState("")
  const [regEmail, setRegEmail]                 = useState("")
  const [regName, setRegName]                   = useState("")
  const [regPw, setRegPw]                       = useState("")
  const [regPw2, setRegPw2]                     = useState("")
  const [regTradingLevel, setRegTradingLevel]   = useState("")
  const [regMarketType, setRegMarketType]       = useState("")
  const [regTradingType, setRegTradingType]     = useState("")
  const [regYearsExp, setRegYearsExp]           = useState("")
  const [showRegPw, setShowRegPw]               = useState(false)
  const [showRegPw2, setShowRegPw2]             = useState(false)
  const [bkEmail, setBkEmail]             = useState("")
  const [bkCode, setBkCode]               = useState("")
  const [fgEmail,  setFgEmail]                  = useState("")
  const [fgOtp,    setFgOtp]                    = useState("")
  const [fgNewPw,  setFgNewPw]                  = useState("")
  const [fgNewPw2, setFgNewPw2]                 = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    const res = await login(loginId, loginPw)
    setLoading(false)
    if (!res.success) { setError(res.error); return }
    const s = getSession(); if (s) onAuth(s)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (!regId.trim()) { setError("Please choose a User ID."); return }
    if (!/^[a-z0-9_]+$/.test(regId.trim())) { setError("User ID may only contain lowercase letters, numbers, and underscores."); return }
    if (regPw !== regPw2) { setError("Passwords do not match."); return }
    if (regPw.length < 8) { setError("Password must be at least 8 characters."); return }
    setLoading(true)
    const res = await registerDashboardUser({
      userId:         regId.trim().toLowerCase(),
      email:          regEmail.trim().toLowerCase(),
      fullName:       regName.trim(),
      password:       regPw,
      tradingLevel:   regTradingLevel  || undefined,
      marketType:     regMarketType    || undefined,
      tradingType:    regTradingType   || undefined,
      yearsExperience: regYearsExp     || undefined,
    })
    setLoading(false)
    if (!res.success) { setError(res.error); return }
    setGeneratedBackup(res.backupCode)
    storeBackupCode(res.backupCode)
    onBackupCode(res.backupCode)
    setMode("backup_shown")
    const loginRes = await login(regId.trim().toLowerCase(), regPw)
    if (loginRes.success) { const s = getSession(); if (s) setTimeout(() => onAuth(s), 100) }
  }

  const handleBackupLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    const res = await loginWithBackupCode(bkEmail, bkCode)
    setLoading(false)
    if (!res.success) { setError(res.error); return }
    const s = getSession(); if (s) onAuth(s)
  }

  // Step 1 — send OTP
  const handleGoogleLogin = async () => {
    setError(""); setLoading(true)
    const res = await signInWithGoogle()
    setLoading(false)
    if (!res.success) { setError(res.error ?? "Google sign-in failed."); return }
    setSession(res.user)
  }

  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    const res = await sendPasswordResetOtp(fgEmail)
    setLoading(false)
    if (!res.success) { setError(res.error ?? "Something went wrong."); return }
    setSuccess("OTP sent! Check your email inbox.")
    setMode("forgot_otp")
  }

  // Step 2 — verify OTP and set new password
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (fgNewPw.length < 8) { setError("Password must be at least 8 characters."); return }
    if (fgNewPw !== fgNewPw2) { setError("Passwords do not match."); return }
    setLoading(true)
    const res = await verifyOtpAndResetPassword(fgEmail, fgOtp, fgNewPw)
    setLoading(false)
    if (!res.success) { setError(res.error ?? "Something went wrong."); return }
    setSuccess("Password updated! You can now sign in.")
    setMode("login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pt-20 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-sans">Client Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Secure member access portal</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {(mode === "login" || mode === "register") && (
            <div className="flex rounded-xl border border-border bg-secondary/30 p-1 gap-1">
              {(["login", "register"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError("") }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />{success}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">User ID or Email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input value={loginId} onChange={e => setLoginId(e.target.value.trim())} placeholder="your_user_id or email" required autoComplete="username"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type={showPw ? "text" : "password"} value={loginPw} onChange={e => setLoginPw(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center"><span className="px-2 bg-card text-xs text-muted-foreground">or</span></div>
              </div>
              <button type="button" onClick={handleGoogleLogin} disabled={loading}
                className="w-full py-2.5 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 font-semibold text-sm text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <button type="button" onClick={() => { setMode("backup"); setError("") }} className="hover:text-foreground transition-colors">Use backup code</button>
                <button type="button" onClick={() => { setMode("forgot"); setError("") }} className="hover:text-foreground transition-colors">Forgot password?</button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your full name" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value.trim().toLowerCase())} placeholder="you@email.com" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              {/* User ID */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Choose User ID <span className="text-muted-foreground/60 font-normal">(lowercase, letters, numbers, underscores)</span></label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input value={regId} onChange={e => setRegId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="unique_user_id" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type={showRegPw ? "text" : "password"} value={regPw} onChange={e => setRegPw(e.target.value)} placeholder="Min. 8 characters" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  <button type="button" onClick={() => setShowRegPw(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Confirm Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm Password</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type={showRegPw2 ? "text" : "password"} value={regPw2} onChange={e => setRegPw2(e.target.value)} placeholder="Repeat password" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  <button type="button" onClick={() => setShowRegPw2(v => !v)} className="text-muted-foreground hover:text-foreground">
                    {showRegPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Trading profile divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center"><span className="px-2 bg-card text-xs text-muted-foreground">Trading Profile (optional)</span></div>
              </div>

              {/* Trading Level */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Trading Level</label>
                <select value={regTradingLevel} onChange={e => setRegTradingLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/20 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select level</option>
                  <option value="beginner">Beginner (0–1 year)</option>
                  <option value="intermediate">Intermediate (1–3 years)</option>
                  <option value="advanced">Advanced (3–5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>

              {/* Market Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Primary Market</label>
                <select value={regMarketType} onChange={e => setRegMarketType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/20 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select market</option>
                  <option value="forex">Forex</option>
                  <option value="crypto">Crypto</option>
                  <option value="stocks">Stocks</option>
                  <option value="commodities">Commodities (Gold, Oil)</option>
                  <option value="indices">Indices</option>
                  <option value="multi">Multiple Markets</option>
                </select>
              </div>

              {/* Trading Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Trading Style</label>
                <select value={regTradingType} onChange={e => setRegTradingType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/20 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  <option value="">Select style</option>
                  <option value="scalper">Scalper</option>
                  <option value="day_trader">Day Trader</option>
                  <option value="swing_trader">Swing Trader</option>
                  <option value="position_trader">Position Trader</option>
                </select>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-1">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {mode === "backup" && (
            <form onSubmit={handleBackupLogin} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your email and backup code to regain access.</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="email" value={bkEmail} onChange={e => setBkEmail(e.target.value.trim().toLowerCase())} placeholder="you@email.com" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Backup Code</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input value={bkCode} onChange={e => setBkCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono tracking-wider" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? "Verifying..." : "Access with Backup Code"}
              </button>
              <button type="button" onClick={() => { setMode("login"); setError("") }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">Back to login</button>
            </form>
          )}

          {/* Step 1: enter email */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotSend} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">Forgot your password?</p>
                <p className="text-xs text-muted-foreground">Enter your registered email and we will send a 6-digit OTP.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="email" value={fgEmail} onChange={e => setFgEmail(e.target.value.trim().toLowerCase())} placeholder="you@email.com" required
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess("") }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">Back to login</button>
            </form>
          )}

          {/* Step 2: enter OTP + new password */}
          {(mode === "forgot_otp" || mode === "forgot_reset") && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">Enter your OTP</p>
                <p className="text-xs text-muted-foreground">A 6-digit code was sent to <span className="text-foreground font-medium">{fgEmail}</span>. It expires in 15 minutes.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">6-Digit OTP</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                    value={fgOtp} onChange={e => setFgOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" required autoComplete="one-time-code"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono tracking-widest"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">New Password</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="password" value={fgNewPw} onChange={e => setFgNewPw(e.target.value)}
                    placeholder="min. 8 characters" required autoComplete="new-password"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm New Password</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="password" value={fgNewPw2} onChange={e => setFgNewPw2(e.target.value)}
                    placeholder="repeat password" required autoComplete="new-password"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); setFgOtp("") }} className="hover:text-foreground transition-colors">Resend OTP</button>
                <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess("") }} className="hover:text-foreground transition-colors">Back to login</button>
              </div>
            </form>
          )}

          {mode === "backup_shown" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-400 text-sm">Save your backup code — shown only once</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Store it safely. It restores your account if you lose your password.</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4 font-mono tracking-widest text-center text-foreground text-lg select-all">
                {generatedBackup}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedBackup); setBackupCopied(true); setTimeout(() => setBackupCopied(false), 2000) }}
                className="w-full py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2"
              >
                {backupCopied ? <><Check className="w-4 h-4 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Backup Code</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Session Timeout Overlay ───────────────────────────────────────────────────

function TimeoutOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="rounded-2xl border border-border bg-card p-6 max-w-sm w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mx-auto">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="font-bold text-foreground">Session Timed Out</h2>
        <p className="text-sm text-muted-foreground">Your session expired after 5 minutes of inactivity.</p>
        <button onClick={onDismiss} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
          Sign In Again
        </button>
      </div>
    </div>
  )
}

// ── Membership Block ──────────────────────────────────────────────────────────

function MembershipBlock({
  label, planIcon, membership, renewHref,
}: {
  label: string
  planIcon: React.ReactNode
  membership: { plan: string; status: string; joinDate: string; expiryDate: string | null } | null
  renewHref: string
}) {
  const isPending = membership?.status === "pending"
  const isActive  = membership?.status === "active"
  const isExpired = membership?.status === "expired"
  const days = isActive || isExpired ? daysLeft(membership?.expiryDate) : null
  const expiring = days !== null && days > 0 && days <= 14
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            {planIcon}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{membership?.plan ?? "Not enrolled"}</p>
          </div>
        </div>
        <StatusBadge status={membership?.status ?? "none"} />
      </div>

      {/* Pending approval — hide all dates */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Payment submitted. Waiting for admin approval — dates will appear once approved.
        </div>
      )}

      {/* Active or Expired — show Entry Date and Expiry Date */}
      {(isActive || isExpired) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1 mb-0.5"><Calendar className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Entry Date</span></div>
            <p className="text-sm font-semibold text-foreground">{fmt(membership?.joinDate)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1 mb-0.5"><Clock className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Expiry</span></div>
            <p className={`text-sm font-semibold ${expiring ? "text-amber-400" : isExpired ? "text-red-400" : "text-foreground"}`}>
              {fmt(membership?.expiryDate)}
              {days !== null && days > 0 && <span className="text-xs ml-1 opacity-70">({days}d left)</span>}
            </p>
          </div>
        </div>
      )}

      {expiring && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Expiring soon — renew to avoid interruption
        </div>
      )}

      {/* Not enrolled */}
      {!membership && (
        <p className="text-xs text-muted-foreground">Not currently enrolled.</p>
      )}

      <div className="flex gap-2">
        <Link href={renewHref} className="flex-1 text-center py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          {isPending ? "View Plans" : "Renew"}
        </Link>
        {(isActive || isExpired) && (
          <Link href={renewHref} className="flex-1 text-center py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            Extend
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ─────��──────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [session, setSessionState]          = useState<DashboardSession | null>(null)

  const [booting, setBooting]               = useState(true)
  const [loading, setLoading]               = useState(false)
  const [copied, setCopied]                 = useState(false)

  // Backup code (persisted in localStorage after registration)
  const [storedBackup, setStoredBackup]     = useState<string | null>(null)
  const [showBackup, setShowBackup]         = useState(false)
  const [backupCleared, setBackupCleared]   = useState(false)

  // Data
  const [vipMem, setVipMem]                 = useState<Record<string, unknown> | null>(null)
  const [mentorMem, setMentorMem]           = useState<Record<string, unknown> | null>(null)
  const [payments, setPayments]             = useState<Record<string, unknown>[]>([])
  const [usdtOrders, setUsdtOrders]         = useState<Record<string, unknown>[]>([])
  const [signals, setSignals]               = useState<VipSignal[]>([])
  const [perfStats, setPerfStats]           = useState<PerformanceStat[]>([])

  // Check existing session on mount and load stored backup code
  useEffect(() => {
    const s = getSession()
    if (s) {
      setSessionState(s)
      // Always fetch backup code fresh from DB so it is always available
      fetchBackupCode(s.id).then(code => {
        if (code) { setStoredBackup(code); storeBackupCode(code) }
        else setStoredBackup(getStoredBackupCode())
      })
    }
    setBooting(false)
  }, [])

  const loadData = useCallback(async (s: DashboardSession) => {
    setLoading(true)
    const supabase = createClient()

    const { data: mems } = await supabase
      .from("memberships")
      .select("*")
      .or(`email.eq.${s.email},user_id.eq.${s.userId}`)
      .order("created_at", { ascending: false })
    const all = mems ?? []
    setVipMem(all.find((m: Record<string, unknown>) => String(m.plan ?? "").toLowerCase().includes("vip")) ?? null)
    setMentorMem(all.find((m: Record<string, unknown>) => String(m.plan ?? "").toLowerCase().includes("mentor")) ?? null)

    const { data: payData } = await supabase
      .from("admin_submissions")
      .select("id,created_at,payment_method,amount,utr,status,type")
      .or(`email.eq.${s.email},user_id.eq.${s.userId}`)
      .order("created_at", { ascending: false })
      .limit(30)
    setPayments(payData ?? [])

    const [{ data: buyData }, { data: sellData }] = await Promise.all([
      supabase.from("usdt_buy_requests").select("*").or(`email.eq.${s.email},user_id.eq.${s.userId}`).order("created_at", { ascending: false }),
      supabase.from("usdt_sell_requests").select("*").or(`email.eq.${s.email},user_id.eq.${s.userId}`).order("created_at", { ascending: false }),
    ])
    const combined = [
      ...(buyData ?? []).map((o: Record<string, unknown>) => ({ ...o, _type: "Buy" })),
      ...(sellData ?? []).map((o: Record<string, unknown>) => ({ ...o, _type: "Sell" })),
    ].sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())
    setUsdtOrders(combined)

    const [sigs, stats] = await Promise.all([getVipSignals(), getPerformanceStats()])
    setSignals(sigs.filter(sig => sig.status === "active").slice(0, 5))
    setPerfStats(stats.slice(-6))

    setLoading(false)
  }, [])

  useEffect(() => { if (session) loadData(session) }, [session, loadData])

  const handleAuth = (s: DashboardSession) => {
    setSessionState(s)
    // Always fetch fresh from DB — auto-generates if the user has no code yet
    fetchBackupCode(s.id).then(code => {
      if (code) { setStoredBackup(code); storeBackupCode(code) }
    })
  }

  const handleLogout = () => {
    logout(); setSessionState(null)
  }

  const mapMem = (row: Record<string, unknown> | null) => row ? {
    plan:       String(row.plan ?? ""),
    status:     String(row.status ?? "none"),
    joinDate:   String(row.joined_at ?? row.created_at ?? ""),
    expiryDate: row.expires_at ? String(row.expires_at) : null,
  } : null

  const vip          = mapMem(vipMem)
  const mentor       = mapMem(mentorMem)
  const hasVip       = vip?.status === "active"
  const hasMentor    = mentor?.status === "active"
  const payPending   = payments.filter(p => String(p.status) === "pending").length
  const payApproved  = payments.filter(p => String(p.status) === "approved").length
  const payRejected  = payments.filter(p => String(p.status) === "rejected").length
  const usdtApproved = usdtOrders.filter(o => String(o.status) === "approved").length
  const usdtPending  = usdtOrders.filter(o => String(o.status) === "pending").length
  const referralLink = typeof window !== "undefined" && session
    ? `${window.location.origin}/vip-group?ref=${session.userId}` : ""
  const avgProfit = perfStats.length
    ? (perfStats.reduce((s, p) => s + p.profitPercent, 0) / perfStats.length).toFixed(1)
    : "—"

  if (booting) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
    </div>
  )

  if (!session) return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40">
        <BackButton />
      </div>
      <AuthScreen
        onAuth={handleAuth}
        onBackupCode={(code) => setStoredBackup(code)}
      />
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-sans">Client Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome back, <span className="text-foreground font-medium">{session.fullName}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">ID: {session.userId}</span>
            <PushNotificationBell userId={session.id} />
            <button onClick={() => loadData(session)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-section quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/trade-dashboard"
            className="flex items-center gap-4 rounded-2xl border border-border bg-card hover:border-[#FCD535]/50 hover:bg-[#FCD535]/5 transition-colors px-5 py-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FCD535]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-[#FCD535]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground group-hover:text-[#FCD535] transition-colors">Trade Dashboard</p>
              <p className="text-xs text-muted-foreground">Live signals, performance & analysis</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#FCD535] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors px-5 py-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">My Profile</p>
              <p className="text-xs text-muted-foreground">Edit your account details & settings</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>

        <div className="space-y-4">

          {/* 1. My Membership */}
          <Card title="My Membership" icon={<Crown className="w-4 h-4 text-primary" />} defaultOpen={true}>
            <div className="space-y-3 pt-1">
              <MembershipBlock label="VIP Membership"        planIcon={<Crown className="w-4 h-4 text-primary" />}    membership={vip}    renewHref="/vip-group"  />
              <MembershipBlock label="Mentorship Membership" planIcon={<Shield className="w-4 h-4 text-blue-400" />}  membership={mentor} renewHref="/mentorship" />
            </div>
          </Card>

          {/* 2. Payment Status */}
          <Card title="Payment Status" icon={<Activity className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { label: "Pending",  value: payPending,  cls: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Approved", value: payApproved, cls: "text-green-400", bg: "bg-green-500/10" },
                { label: "Rejected", value: payRejected, cls: "text-red-400",   bg: "bg-red-500/10"   },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border border-border ${s.bg} p-4 text-center`}>
                  <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Payment History */}
          <Card title="Payment History" icon={<CreditCard className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1">
              {payments.length === 0
                ? <p className="text-sm text-muted-foreground py-6 text-center">No payment records found.</p>
                : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/30 border-b border-border">
                            {["Date", "Method", "Amount", "UTR", "Status"].map(h => (
                              <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-secondary/20">
                              <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmt(String(p.created_at ?? ""))}</td>
                              <td className="px-3 py-2.5 text-xs text-foreground capitalize">{String(p.payment_method ?? "—")}</td>
                              <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{p.amount ? `₹${p.amount}` : "—"}</td>
                              <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{String(p.utr ?? "—")}</td>
                              <td className="px-3 py-2.5"><StatusBadge status={String(p.status ?? "pending")} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </Card>

          {/* 4. VIP Signals */}
          <Card
            title="VIP Signals"
            icon={<Star className="w-4 h-4 text-primary" />}
            defaultOpen={hasVip}
            badge={hasVip ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Live</span> : undefined}
          >
            <div className="pt-1 space-y-3">
              {!hasVip ? (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-muted-foreground">VIP Signals are exclusive to active VIP Group members.</p>
                  <Link href="/vip-group" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Upgrade to VIP <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : signals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No active signals right now. Check back soon.</p>
              ) : (
                <>
                  {signals.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/20 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${s.direction === "BUY" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{s.direction}</span>
                      <span className="font-bold text-foreground text-sm">{s.pair}</span>
                      <span className="text-xs text-muted-foreground">Entry: {s.entry}</span>
                      <span className="text-xs text-muted-foreground">SL: {s.stopLoss}</span>
                      <span className="text-xs text-muted-foreground">TP: {s.takeProfit1}</span>
                    </div>
                  ))}
                  <Link href="/vip-signals" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    View all signals <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </Card>

          {/* 5. Performance */}
          <Card title="Performance" icon={<BarChart2 className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1 space-y-4">
              {perfStats.length === 0
                ? <p className="text-sm text-muted-foreground py-2">Performance data coming soon.</p>
                : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Avg Profit",   value: `${avgProfit}%`, color: "text-green-400" },
                        { label: "Avg Win Rate", value: `${(perfStats.reduce((s, p) => s + p.winRate, 0) / perfStats.length).toFixed(0)}%`, color: "text-foreground" },
                        { label: "Total Trades", value: String(perfStats.reduce((s, p) => s + p.totalTrades, 0)), color: "text-foreground" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/30 border-b border-border">
                            {["Month", "Profit", "Win Rate", "Trades", "W/L"].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...perfStats].reverse().map(s => (
                            <tr key={s.id} className="border-b border-border/40 hover:bg-secondary/20">
                              <td className="px-3 py-2 text-xs font-medium text-foreground whitespace-nowrap">{s.monthLabel}</td>
                              <td className={`px-3 py-2 font-bold text-xs ${s.profitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>{s.profitPercent >= 0 ? "+" : ""}{s.profitPercent}%</td>
                              <td className="px-3 py-2 text-xs text-foreground">{s.winRate}%</td>
                              <td className="px-3 py-2 text-xs text-foreground">{s.totalTrades}</td>
                              <td className="px-3 py-2 text-xs"><span className="text-green-400">{s.winningTrades}W</span> / <span className="text-red-400">{s.losingTrades}L</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
            </div>
          </Card>

          {/* 6. Mentorship Content */}
          <Card title="Mentorship Content" icon={<BookOpen className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1 space-y-2">
              {!hasMentor ? (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-muted-foreground">Enroll in mentorship to access structured course content.</p>
                  <Link href="/mentorship" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Enroll Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                [
                  { module: "Module 1", title: "SMC Fundamentals",              available: true },
                  { module: "Module 2", title: "Order Blocks & BOS",            available: true },
                  { module: "Module 3", title: "Liquidity & Fair Value Gaps",    available: true },
                  { module: "Module 4", title: "Entry Models & Risk Management", available: true },
                  { module: "Module 5", title: "Live Trade Walkthroughs",        available: false },
                ].map(m => (
                  <div key={m.module} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{m.module}</p>
                      <p className="font-medium text-foreground text-sm">{m.title}</p>
                    </div>
                    {m.available
                      ? <Link href="/material" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">Access <ArrowRight className="w-3 h-3" /></Link>
                      : <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary border border-border shrink-0">Soon</span>
                    }
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 7. USDT P2P Activity */}
          <Card title="USDT P2P Activity" icon={<CreditCard className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Orders", value: usdtOrders.length, cls: "text-foreground" },
                  { label: "Completed",    value: usdtApproved,       cls: "text-green-400" },
                  { label: "Pending",      value: usdtPending,        cls: "text-amber-400" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                    <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {usdtOrders.length > 0 && (
                <div className="rounded-xl border border-border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/30 border-b border-border">
                        {["Date", "Type", "Amount", "Rate", "Status"].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usdtOrders.slice(0, 10).map((o, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-secondary/20">
                          <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{fmt(String(o.created_at ?? ""))}</td>
                          <td className="px-3 py-2"><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${String(o._type) === "Buy" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{String(o._type)}</span></td>
                          <td className="px-3 py-2 text-xs font-semibold text-foreground">{o.amount ? `${o.amount} USDT` : "—"}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{o.rate ? `₹${o.rate}` : "—"}</td>
                          <td className="px-3 py-2"><StatusBadge status={String(o.status ?? "pending")} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Link href="/usdt-p2p" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Go to USDT P2P <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>

          {/* 8. Community Updates */}
          <Card title="Community Updates" icon={<Bell className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1 space-y-4">
              <p className="text-sm text-muted-foreground">Join the official channels for live updates, signals, and announcements.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <a href="https://t.me/OGKAALVIP" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <MessageCircle className="w-5 h-5 text-primary shrink-0" />
                  <div><p className="font-semibold text-foreground text-sm">VIP Telegram Group</p><p className="text-xs text-muted-foreground">Signals &amp; analysis</p></div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </a>
                <a href="https://t.me/OGKAAL" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div><p className="font-semibold text-foreground text-sm">Community Channel</p><p className="text-xs text-muted-foreground">News &amp; updates</p></div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </a>
              </div>
            </div>
          </Card>

          {/* 8b. Notification Preferences */}
          <Card title="Notification Preferences" icon={<Bell className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1">
              <p className="text-sm text-muted-foreground mb-4">Choose which types of notifications you want to receive on this device.</p>
              <NotificationSettingsPanel userId={session.id} />
            </div>
          </Card>

          {/* 9. Referral Program */}
          <Card title="Referral Program" icon={<Link2 className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1 space-y-4">
              <p className="text-sm text-muted-foreground">Share your unique link. Earn rewards when friends join OG Kaal.</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/20">
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{referralLink}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a href={`https://wa.me/?text=${encodeURIComponent("Join OG Kaal – Premium Forex Trading Community: " + referralLink)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">
                  WhatsApp
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join OG Kaal – Premium Forex Trading Community.")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">
                  Telegram
                </a>
              </div>
            </div>
          </Card>

          {/* 10. Account Settings */}
          <Card title="Account Settings" icon={<Shield className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
            <div className="pt-1 space-y-2">
              {[
                { label: "Full Name",    value: session.fullName },
                { label: "Email",        value: session.email },
                { label: "User ID",      value: session.userId },
                { label: "Member Since", value: fmt(session.createdAt) },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20 gap-4">
                  <p className="text-xs text-muted-foreground shrink-0">{f.label}</p>
                  <p className="font-medium text-foreground text-sm text-right truncate">{f.value}</p>
                </div>
              ))}

              {/* Backup Code */}
              <div className="px-4 py-3 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-xs font-medium text-foreground">Backup Code</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBackup(v => !v)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showBackup ? "Hide backup code" : "Show backup code"}
                  >
                    {showBackup ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {storedBackup ? (
                  <>
                    <div className={`font-mono text-sm tracking-widest px-2 py-2 rounded bg-secondary border border-border text-center transition-all duration-200 ${showBackup ? "text-foreground select-all" : "blur-sm select-none pointer-events-none"}`}>
                      {storedBackup}
                    </div>
                    {showBackup && (
                      <button
                        onClick={() => navigator.clipboard.writeText(storedBackup!)}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Use this code to recover access to your account if you forget your password.</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading backup code...</p>
                )}
              </div>

              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors mt-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
