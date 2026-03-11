"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Settings,
  LogOut,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Users,
  Wrench,
  LayoutDashboard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
} from "lucide-react"
import {
  getSession,
  logout,
  login,
  registerDashboardUser,
  storeBackupCode,
} from "@/lib/dash-auth"
import type { DashboardSession } from "@/lib/dash-auth"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function AvatarCircle({
  name,
  avatarUrl,
  size = 32,
}: {
  name?: string
  avatarUrl?: string
  size?: number
}) {
  if (!name) {
    return (
      <div
        className="rounded-full bg-muted flex items-center justify-center shrink-0 border-2 border-border"
        style={{ width: size, height: size }}
      >
        <User style={{ width: size * 0.5, height: size * 0.5 }} className="text-muted-foreground" />
      </div>
    )
  }
  const initials = getInitials(name)
  return (
    <div
      className="rounded-full bg-[#FCD535] flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#FCD535]/40"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" crossOrigin="anonymous" />
      ) : initials ? (
        <span className="font-bold text-[#0B0E11] leading-none" style={{ fontSize: size * 0.35 }}>
          {initials}
        </span>
      ) : (
        <User style={{ width: size * 0.5, height: size * 0.5 }} className="text-[#0B0E11]" />
      )}
    </div>
  )
}

function LoggedOutPopup({
  onAuth,
  open,
  setOpen,
  triggerRef,
}: {
  onAuth: (s: DashboardSession) => void
  open: boolean
  setOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  triggerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [tab, setTab]       = useState<"login" | "register">("login")
  const [identifier, setId] = useState("")
  const [password, setPw]   = useState("")
  const [showPw, setShowPw] = useState(false)
  const [regName, setRN]    = useState("")
  const [regEmail, setRE]   = useState("")
  const [regId, setRI]      = useState("")
  const [regPw, setRP]      = useState("")
  const [regPw2, setRP2]    = useState("")
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoad(true)
    const res = await login(identifier, password)
    setLoad(false)
    if (!res.success) { setError(res.error); return }
    const s = getSession()
    if (s) onAuth(s)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (regPw !== regPw2) { setError("Passwords do not match."); return }
    if (regPw.length < 8) { setError("Password must be at least 8 characters."); return }
    setLoad(true)
    const res = await registerDashboardUser({
      userId:   regId.trim().toLowerCase(),
      email:    regEmail.trim().toLowerCase(),
      fullName: regName.trim(),
      password: regPw,
    })
    setLoad(false)
    if (!res.success) { setError(res.error); return }
    storeBackupCode(res.backupCode)
    const loginRes = await login(regId.trim().toLowerCase(), regPw)
    if (loginRes.success) {
      const s = getSession()
      if (s) onAuth(s)
    }
  }

  return (
    <div ref={triggerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Sign in or create account"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-border hover:border-primary transition-colors focus:outline-none"
      >
        <User className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border bg-secondary/20">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Client Area</p>
              <p className="text-[10px] text-muted-foreground">OG KAAL Members</p>
            </div>
          </div>

          <div className="flex rounded-xl border border-border bg-secondary/30 p-1 gap-1 mx-3 mt-3">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError("") }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div className="px-3 pb-4 pt-2 space-y-2">
            {error && (
              <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    value={identifier}
                    onChange={(e) => setId(e.target.value.trim())}
                    placeholder="User ID or Email"
                    required
                    autoComplete="username"
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                <p className="text-center text-[10px] text-muted-foreground">
                  Forgot password?{" "}
                  <Link href="/dashboard?mode=forgot" onClick={() => setOpen(false)} className="text-primary hover:underline">
                    Reset here
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input value={regName} onChange={(e) => setRN(e.target.value)} placeholder="Full Name" required
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input type="email" value={regEmail} onChange={(e) => setRE(e.target.value.trim().toLowerCase())} placeholder="Email" required
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input value={regId} onChange={(e) => setRI(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="Choose User ID" required
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input type="password" value={regPw} onChange={(e) => setRP(e.target.value)} placeholder="Password (min. 8 chars)" required
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/20 focus-within:border-primary transition-colors">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input type="password" value={regPw2} onChange={(e) => setRP2(e.target.value)} placeholder="Confirm Password" required
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function UserAvatar() {
  const router = useRouter()
  const ref    = useRef<HTMLDivElement>(null)
  const [session, setSessionState] = useState<DashboardSession | null>(null)
  const [mounted, setMounted]      = useState(false)
  const [open, setOpen]            = useState(false)

  useEffect(() => {
    setMounted(true)
    setSessionState(getSession())

    const onAvatarUpdated = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url
      setSessionState((prev) => (prev ? { ...prev, avatarUrl: url } : prev))
    }
    const onStorage = () => setSessionState(getSession())

    window.addEventListener("avatar-updated", onAvatarUpdated)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("avatar-updated", onAvatarUpdated)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  const handleLogout = () => {
    logout()
    setOpen(false)
    setSessionState(null)
    router.push("/")
    router.refresh()
  }

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-muted border-2 border-border animate-pulse shrink-0" />
  }

  if (!session) {
    return (
      <LoggedOutPopup
        onAuth={(s) => { setSessionState(s); setOpen(false); router.refresh() }}
        open={open}
        setOpen={setOpen}
        triggerRef={ref}
      />
    )
  }

  const avatarUrl = session.avatarUrl
  const name      = session.fullName
  const clientId  = session.numericUid ?? session.userId

  const menuItems = [
    { href: "/dashboard",            icon: LayoutDashboard, label: "My Dashboard"        },
    { href: "/profile",              icon: User,            label: "My Profile"           },
    { href: "/trade-dashboard",      icon: TrendingUp,      label: "Trade Dashboard"      },
    { href: "/material",             icon: BookOpen,        label: "Learning / Materials" },
    { href: "/community",            icon: Users,           label: "Community"            },
    { href: "/funded-tools",         icon: Wrench,          label: "Funded Tools"         },
    { href: "/profile?tab=settings", icon: Settings,        label: "Settings"             },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-secondary/60 transition-colors focus:outline-none"
      >
        <AvatarCircle name={name} avatarUrl={avatarUrl} size={32} />
        <span className="hidden sm:block text-xs font-bold text-foreground tracking-wide whitespace-nowrap">
          {name.split(" ")[0].toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="flex flex-col items-center px-5 pt-5 pb-4 border-b border-border bg-secondary/20">
            <AvatarCircle name={name} avatarUrl={avatarUrl} size={72} />
            <p className="mt-3 text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
              ID: {clientId}
            </p>
            <p className="mt-0.5 text-base font-extrabold text-foreground tracking-wide uppercase text-center">
              {name}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#FCD535]/40 bg-[#FCD535]/10 text-[#FCD535]">
                Regular
              </span>
              {session.isVerified ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verified
                </span>
              ) : session.kycStatus === "pending" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  Pending Review
                </span>
              ) : (
                <Link href="/profile?tab=verify" onClick={() => setOpen(false)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-border bg-secondary/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  Get Verified
                </Link>
              )}
            </div>
          </div>

          <div className="py-1">
            {menuItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border py-1">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
