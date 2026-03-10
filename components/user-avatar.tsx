"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Settings, Shield, LogOut } from "lucide-react"
import { getSession, logout } from "@/lib/dash-auth"
import type { DashboardSession } from "@/lib/dash-auth"

function getInitials(name: string) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getFirstName(fullName: string) {
  return fullName.split(" ")[0].toUpperCase()
}

export function UserAvatar() {
  const router  = useRouter()
  const ref     = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState<DashboardSession | null>(null)
  const [open, setOpen]       = useState(false)

  useEffect(() => {
    setSession(getSession())
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Don't render anything if user is not logged into dashboard
  if (!session) return null

  const initials  = getInitials(session.fullName)
  const firstName = getFirstName(session.fullName)
  const avatarUrl = (session as any).avatarUrl as string | undefined

  const handleLogout = () => {
    logout()
    setOpen(false)
    router.push("/dashboard")
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger: avatar circle + first name */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-secondary/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
      >
        {/* Avatar circle */}
        <div className="w-8 h-8 rounded-full bg-[#FCD535] flex items-center justify-center overflow-hidden border-2 border-[#FCD535]/40 group-hover:border-[#FCD535] transition-colors shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={session.fullName} className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <span className="text-xs font-bold text-[#0B0E11] leading-none">{initials}</span>
          )}
        </div>
        {/* First name — bold, uppercase */}
        <span className="hidden sm:block text-xs font-bold text-foreground tracking-wide whitespace-nowrap">
          {firstName}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FCD535] flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={session.fullName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <span className="text-sm font-bold text-[#0B0E11]">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{session.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{session.email}</p>
              </div>
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
