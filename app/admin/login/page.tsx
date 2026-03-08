"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  ArrowLeft,
  KeyRound,
} from "lucide-react"
import {
  loginAdmin,
  verify2FA,
  sendPhoneOTP,
  verifyPhoneOTP,
  requestPasswordReset,
  verifyResetOTP,
  resetPassword,
} from "@/lib/admin-auth"

type LoginMethod = "email" | "username" | "phone"
type ViewState = "login" | "otp" | "forgot-password" | "reset-otp" | "new-password"

export default function AdminLoginPage() {
  const router = useRouter()

  // Form state
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // UI state
  const [view, setView] = useState<ViewState>("login")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [devOTP, setDevOTP] = useState("")

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!identifier.trim()) {
      setError(`Please enter your ${loginMethod}`)
      setIsLoading(false)
      return
    }

    if (!password) {
      setError("Please enter your password")
      setIsLoading(false)
      return
    }

    const result = await loginAdmin(identifier, password)

    if (result.requires2FA) {
      if (result.devOTP) {
        setDevOTP(result.devOTP)
        setSuccess(`Development OTP: ${result.devOTP}`)
      } else {
        setSuccess("Password verified. OTP sent.")
      }
      setView("otp")
      setIsLoading(false)
      return
    }

    if (result.success) {
      router.push("/admin/dashboard")
    } else {
      setError(result.error || "Login failed")
    }

    setIsLoading(false)
  }

  const handlePhoneOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!identifier.trim()) {
      setError("Please enter your phone number")
      setIsLoading(false)
      return
    }

    const result = await sendPhoneOTP(identifier)

    if (result.success) {
      if (result.devOTP) {
        setDevOTP(result.devOTP)
        setSuccess(`Development OTP: ${result.devOTP}`)
      } else {
        setSuccess("OTP sent.")
      }
      setView("otp")
    } else {
      setError(result.error || "Failed to send OTP")
    }

    setIsLoading(false)
  }

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      setIsLoading(false)
      return
    }

    const result =
      loginMethod === "phone"
        ? await verifyPhoneOTP(identifier, otp)
        : await verify2FA(identifier, otp)

    if (result.success) {
      router.push("/admin/dashboard")
    } else {
      setError(result.error || "Verification failed")
    }

    setIsLoading(false)
  }

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!identifier.trim() || !identifier.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    const result = await requestPasswordReset(identifier)

    if (result.success) {
      if (result.devOTP) {
        setDevOTP(result.devOTP)
        setSuccess(`Development OTP: ${result.devOTP}`)
      } else {
        setSuccess("OTP sent to your email.")
      }
      setView("reset-otp")
    } else {
      setError(result.error || "Failed to send reset OTP")
    }

    setIsLoading(false)
  }

  const handleResetOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      setIsLoading(false)
      return
    }

    const result = await verifyResetOTP(identifier, otp)

    if (result.success && result.resetToken) {
      setResetToken(result.resetToken)
      setSuccess("OTP verified. Enter your new password.")
      setView("new-password")
      setOtp("")
    } else {
      setError(result.error || "Verification failed")
    }

    setIsLoading(false)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const result = await resetPassword(identifier, resetToken, newPassword)

    if (result.success) {
      setSuccess("Password reset successful! You can now login.")
      setView("login")
      setPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setResetToken("")
    } else {
      setError(result.error || "Reset failed")
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setView("login")
    setError("")
    setSuccess("")
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setResetToken("")
    setDevOTP("")
  }

  const getIdentifierIcon = () => {
    switch (loginMethod) {
      case "email":
        return <Mail className="w-5 h-5 text-muted-foreground" />
      case "username":
        return <User className="w-5 h-5 text-muted-foreground" />
      case "phone":
        return <Phone className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getIdentifierPlaceholder = () => {
    switch (loginMethod) {
      case "email":
        return "Enter admin email"
      case "username":
        return "Enter admin username"
      case "phone":
        return "Enter admin phone"
    }
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

        {/* Login Form */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          {/* Back button for non-login views */}
          {view !== "login" && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Login View */}
          {view === "login" && (
            <>
              {/* Login Method Tabs */}
              <div className="flex gap-2 mb-6">
                {(["email", "username", "phone"] as LoginMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setLoginMethod(method)
                      setIdentifier("")
                      setError("")
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      loginMethod === method
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </button>
                ))}
              </div>

              <form
                onSubmit={loginMethod === "phone" ? handlePhoneOTPRequest : handlePasswordLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {loginMethod.charAt(0).toUpperCase() + loginMethod.slice(1)}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {getIdentifierIcon()}
                    </div>
                    <input
                      type={loginMethod === "email" ? "email" : "text"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={getIdentifierPlaceholder()}
                      autoComplete={loginMethod === "email" ? "email" : "username"}
                    />
                  </div>
                </div>

                {loginMethod !== "phone" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
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
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                >
                  {isLoading
                    ? "Please wait..."
                    : loginMethod === "phone"
                      ? "Send OTP"
                      : "Login"}
                </Button>

                {loginMethod !== "phone" && (
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot-password")
                      setError("")
                      setSuccess("")
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                  >
                    Forgot Password?
                  </button>
                )}
              </form>
            </>
          )}

          {/* OTP Verification View */}
          {view === "otp" && (
            <form onSubmit={handleOTPVerify} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {loginMethod === "phone"
                    ? "Enter the OTP sent to your phone"
                    : "Enter the 2FA verification code"}
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full py-4 text-center text-2xl font-mono tracking-[0.5em] rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              {devOTP && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                  <p className="text-xs text-amber-400 mb-1">Development Mode</p>
                  <p className="text-lg font-mono font-bold text-amber-300 tracking-widest">{devOTP}</p>
                </div>
              )}
            </form>
          )}

          {/* Forgot Password View */}
          {view === "forgot-password" && (
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="font-semibold text-foreground">Forgot Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your admin email to receive a reset OTP
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter admin email"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
              >
                {isLoading ? "Sending..." : "Send Reset OTP"}
              </Button>
            </form>
          )}

          {/* Reset OTP Verification View */}
          {view === "reset-otp" && (
            <form onSubmit={handleResetOTPVerify} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Verify OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the OTP sent to your email
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full py-4 text-center text-2xl font-mono tracking-[0.5em] rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}

          {/* New Password View */}
          {view === "new-password" && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="font-semibold text-foreground">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your new admin password
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter new password"
                    autoFocus
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
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
