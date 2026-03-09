// Pure utility functions for the community feature — NO Supabase imports.
// Keeping these separate from community-store.ts prevents the Supabase client
// from being pulled into components that only need lightweight helpers.

export type TraderLevel = "Beginner" | "Trader" | "Pro Trader" | "Master Trader"

const LEVEL_COLORS: Record<TraderLevel, string> = {
  Beginner:        "6366f1",
  Trader:          "10b981",
  "Pro Trader":    "f59e0b",
  "Master Trader": "FCD535",
}

export function avatarUrl(name: string, level: TraderLevel): string {
  const color    = LEVEL_COLORS[level]
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&bold=true`
}

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export const SESSION_KEY = "og_community_session"

export interface CommunityUser {
  id: string
  fullName: string
  email: string
  phone: string
  level: TraderLevel
  bio?: string
  avatar: string
  createdAt: string
  isAdmin?: boolean
}

export function getSession(): CommunityUser | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") } catch { return null }
}

export function setSession(user: CommunityUser | null) {
  if (typeof window === "undefined") return
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(SESSION_KEY)
}
