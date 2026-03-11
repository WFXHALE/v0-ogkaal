"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Settings, Shield, LogOut, CheckCircle, LogIn, UserPlus } from "lucide-react"
import { getSession, logout } from "@/lib/dash-auth"
import type { DashboardSession } from "@/lib/dash-auth"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ── Default avatar when no photo is uploaded ──────────────────────────────────
function DefaultAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-muted flex items-center justify-center shrink-0 border-2 border-border"
      style={{ width: size, height: size }}
    >
      <User style={{ width: size * 0.5, height: size * 0.5 }} className="text-muted-foreground" />
    </div>
  )
}

// ── Avatar circle — photo or initials or default ──────────────────────────────
function AvatarCircle({
  name,
  avatarUrl,
  size = 32,
}: {
  name?: string
  avatarUrl?: string
  size?: number
}) {
  if (!name) return <DefaultAvatar size={size} />
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

export function UserAvatar() {
  const router = useRouter()
  const ref    = useRef<HTMLDivElement>(null)
  const [session, setSessionState] = useState<DashboardSession | null>(null)
  const [mounted, setMounted]      = useState(false)
  const [open, setOpen]            = useState(false)

  useEffect(() => {
    setMounted(true)
    setSessionState(getSession())

    // Refresh when avatar is uploaded
    const onAvatarUpdated = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url
      setSessionState(prev => prev ? { ...prev, avatarUrl: url } : prev)
    }
    // Refresh when session changes in another tab
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

  // Before mount, render a placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted border-2 border-border animate-pulse shrink-0" />
    )
  }

  // ── LOGGED OUT: show person icon, clicking opens sign in / sign up prompt ───
  if (!session) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Sign in or create account"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-border hover:border-primary transition-colors focus:outline-none"
        >
          <User className="w-4 h-4 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-secondary/20 text-center">
              <div className="w-12 h-12 rounded-full bg-muted border-2 border-border flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Welcome</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sign in to access your account</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCD535] text-[#0B0E11] text-sm font-bold hover:bg-[#F0B90B] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/dashboard?tab=register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── LOGGED IN ─────────────────────────────────────────────────────────────
  const avatarUrl = session.avatarUrl
  const name      = session.fullName
  const clientId  = session.numericUid ?? session.userId

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-secondary/60 transition-colors focus:outline-none group"
      >
        <AvatarCircle name={name} avatarUrl={avatarUrl} size={32} />
        <span className="hidden sm:block text-xs font-bold text-foreground tracking-wide whitespace-nowrap">
          {name.split(" ")[0].toUpperCase()}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">

          {/* Profile card — matches reference image layout */}
          <div className="flex flex-col items-center px-5 pt-5 pb-4 border-b border-border bg-secondary/20">
            {/* Avatar */}
            <AvatarCircle name={name} avatarUrl={avatarUrl} size={72} />

            {/* Client ID above name */}
            <p className="mt-3 text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
              ID: {clientId}
            </p>

            {/* Full name — bold, uppercase like reference */}
            <p className="mt-0.5 text-base font-extrabold text-foreground tracking-wide uppercase text-center">
              {name}
            </p>

            {/* Verified / Unverified badge */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#FCD535]/40 bg-[#FCD535]/10 text-[#FCD535]">
                Regular
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="w-2.5 h-2.5" />
                Verified
              </span>
            </div>
          </div>

          {/* Menu links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              My Profile
            </Link>
            <Link
              href="/profile?tab=settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
              Account Settings
            </Link>
            <Link
              href="/profile?tab=security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              Security
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
