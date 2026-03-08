"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Lock, Mail, Eye, EyeOff, Shield, UserPlus, AlertCircle, CheckCircle } from "lucide-react"
import { adminExists, createAdminAccount, loginAdmin, isSessionValid } from "@/lib/admin-auth"

// Pre-configured admin credentials (will be hashed on first setup)
const DEFAULT_ADMIN_EMAIL = "swargakai@gmail.com"
const DEFAULT_ADMIN_PASSWORD = "Shahidaxkaal"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if already logged in
    if (isSessionValid()) {
      router.push("/admin")
      return
    }
    
    // Check if admin account exists
    const hasAdmin = adminExists()
    setNeedsSetup(!hasAdmin)
    setIsCheckingAuth(false)
  }, [router])

  const handleSetup = async () => {
    setError("")
    setSuccess("")
    setIsLoading(true)

    const result = await createAdminAccount(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
    
    if (result.success) {
      setSuccess("Admin account created successfully! You can now login.")
      setNeedsSetup(false)
      setEmail(DEFAULT_ADMIN_EMAIL)
    } else {
      setError(result.error || "Failed to create admin account")
    }

    setIsLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Validate inputs
    if (!email.trim()) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (!password) {
      setError("Please enter your password")
      setIsLoading(false)
      return
    }

    const result = await loginAdmin(email, password)
    
    if (result.success) {
      router.push("/admin")
    } else {
      setError(result.error || "Login failed")
    }

    setIsLoading(false)
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground mt-2">OG KAAL TRADER Dashboard</p>
        </div>

        {/* Setup Card (shown if no admin exists) */}
        {needsSetup && (
          <div className="p-6 rounded-2xl bg-card border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">First-Time Setup</h2>
                <p className="text-sm text-muted-foreground">Create your admin account</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-4">
              <p className="text-sm text-muted-foreground mb-2">Admin account will be created with:</p>
              <div className="space-y-1">
                <p className="text-sm font-mono text-foreground">Email: {DEFAULT_ADMIN_EMAIL}</p>
                <p className="text-sm font-mono text-foreground">Password: {"*".repeat(DEFAULT_ADMIN_PASSWORD.length)}</p>
              </div>
            </div>

            <Button
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold"
            >
              {isLoading ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </div>
        )}

        {/* Login Form */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter admin email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || needsSetup}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
            >
              {isLoading ? "Logging in..." : "Login to Dashboard"}
            </Button>

            {needsSetup && (
              <p className="text-xs text-center text-muted-foreground">
                Please complete the setup above before logging in
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  )
}
