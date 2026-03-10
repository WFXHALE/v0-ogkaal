"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, LogOut, ChevronDown } from "lucide-react"
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

export function UserAvatar() {
  const router = useRouter()
  const [session, setSession] = useState<DashboardSession | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!session) return null

  const initials = getInitials(session.fullName)
  const avatarUrl = (session as any).avatarUrl as string | undefined

  const handleLogout = () => {
    logout()
    setOpen(false)
    router.push("/dashboard")
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
        aria-label="User menu"
        aria-expanded={open}
      >
        {/* Avatar circle */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden border-2 border-primary/40 group-hover:border-primary transition-colors">
          {avatarUrl ? (
            <img src={avatarUrl} alt={session.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-primary-foreground leading-none">{initials}</span>
          )}
        </div>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{session.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{session.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              View Profile
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
