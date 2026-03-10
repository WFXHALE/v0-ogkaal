"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  ArrowLeft,
  Phone,
  User,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import {
  adminExists,
  createAdminAccount,
  loginAdmin,
  isSessionValid,
  requestPasswordReset,
  resetPassword,
} from "@/lib/admin-auth"

const DEFAULT_ADMIN_EMAIL    = "swargakai@gmail.com"
const DEFAULT_ADMIN_PASSWORD = "Shahidaxkaal"

type LoginMethod = "email" | "phone" | "username"
type Screen = "login" | "forgot" | "reset"

export function AdminLoginForm() {
  const router = useRouter()

  const [screen, setScreen]             = useState<Screen>("login")
  const [method, setMethod]             = useState<LoginMethod>("email")
  const [identifier, setIdentifier]     = useState("")
  const [password, setPassword]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [forgotEmail, setForgotEmail]   = useState("")
  const [resetCode, setResetCode]       = useState("")
  const [newPassword, setNewPassword]   = useState("")
  const [showNew, setShowNew]           = useState(false)
  const [error, setError]               = useState("")
  const [info, setInfo]                 = useState("")
  const [isLoading, setIsLoading]       = useState(false)
  const [needsSetup, setNeedsSetup]     = useState(false)
  const [isChecking, setIsChecking]     = useState(true)
  const [demoCode, setDemoCode]         = useState<string | null>(null)

  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    setNeedsSetup(!adminExists())
    setIsChecking(false)
  }, [router])

  const clear = () => { setError(""); setInfo("") }

  const handleSetup = async () => {
    clear(); setIsLoading(true)
    const r = await createAdminAccount(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
    if (r.success) {
      setInfo("Admin account created. You can now log in.")
      setNeedsSetup(false)
      setIdentifier(DEFAULT_ADMIN_EMAIL)
      setMethod("email")
    } else {
      setError(r.error || "Setup failed")
    }
    setIsLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); clear()
    if (!identifier.trim()) { setError(`Enter your ${method}`); return }
    if (!password)           { setError("Enter your password"); return }
    setIsLoading(true)
    const r = await loginAdmin(identifier, password, method)
    if (r.success) {
      router.push("/admin")
    } else {
      setError(r.error || "Login failed")
    }
    setIsLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); clear()
    if (!forgotEmail.trim()) { setError("Enter your admin email"); return }
    setIsLoading(true)
    const r = await requestPasswordReset(forgotEmail)
    if (r.success) {
      if (r.resetCode) setDemoCode(r.resetCode)
      setInfo("Reset code generated. Use the code below to set a new password.")
      setScreen("reset")
    } else {
      setError(r.error || "Failed")
    }
    setIsLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); clear()
    if (!resetCode.trim()) { setError("Enter the reset code"); return }
    if (!newPassword)      { setError("Enter a new password"); return }
    setIsLoading(true)
    const r = await resetPassword(resetCode, newPassword)
    if (r.success) {
      setInfo("Password reset successful. You can now log in.")
      setScreen("login")
      setDemoCode(null)
    } else {
      setError(r.error || "Reset failed")
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

  const methodConfig = {
    email:    { icon: Mail,  placeholder: "Admin email address", label: "Email"    },
    phone:    { icon: Phone, placeholder: "Phone number",        label: "Phone"    },
    username: { icon: User,  placeholder: "Username",            label: "Username" },
  } as const
  const { icon: IdentifierIcon, placeholder, label } = methodConfig[method]

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
          <h1 className="text-2xl font-bold text-foreground">
            {screen === "login"  && "Admin Login"}
            {screen === "forgot" && "Forgot Password"}
            {screen === "reset"  && "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">OG KAAL TRADER — Restricted Access</p>
        </div>

        {/* First-time setup */}
        {needsSetup && screen === "login" && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
            <p className="text-sm font-semibold text-amber-400 mb-1">First-Time Setup Required</p>
            <p className="text-xs text-muted-foreground mb-4">
              No admin account found. Click below to create the default admin account.
            </p>
            <Button
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Create Admin Account
            </Button>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">

          {/* Banners */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 mb-4">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{info}</p>
            </div>
          )}
          {demoCode && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/30 mb-4">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-primary">
                Reset code: <span className="font-mono font-bold">{demoCode}</span>
              </p>
            </div>
          )}

          {/* LOGIN */}
          {screen === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-secondary">
                {(["email", "phone", "username"] as LoginMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMethod(m); setIdentifier(""); clear() }}
                    className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      method === m
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <div className="relative">
                  <IdentifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={method === "email" ? "email" : "text"}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={placeholder}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { clear(); setScreen("forgot") }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading || needsSetup}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5"
              >
                {isLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  : <Shield className="w-4 h-4 mr-2" />}
                Login to Dashboard
              </Button>
            </form>
          )}

          {/* FORGOT */}
          {screen === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter your admin email to generate a password reset code.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Generate Reset Code
              </Button>
              <button
                type="button"
                onClick={() => { clear(); setScreen("login") }}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
              >
                Back to login
              </button>
            </form>
          )}

          {/* RESET */}
          {screen === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Reset Code</label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value.trim())}
                  placeholder="Enter reset code"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Reset Password
              </Button>
              <button
                type="button"
                onClick={() => { clear(); setScreen("login") }}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
              >
                Back to login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  )
}
