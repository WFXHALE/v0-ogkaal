"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User, Mail, Phone, AtSign, Camera, Save, CheckCircle, AlertCircle, Shield,
} from "lucide-react"
import { getSession, setSession } from "@/lib/dash-auth"
import type { DashboardSession } from "@/lib/dash-auth"
import { Header } from "@/components/header"

// ── Avatar with initials fallback ─────────────────────────────────────────────

function AvatarCircle({ name, avatarUrl, size = 80 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div
      className="rounded-full bg-primary flex items-center justify-center overflow-hidden border-4 border-primary/30 shrink-0"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-primary-foreground" style={{ fontSize: size * 0.32 }}>
          {initials}
        </span>
      )}
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  label, icon: Icon, value, onChange, placeholder, type = "text", readOnly = false,
}: {
  label: string
  icon: React.ElementType
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  readOnly?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${readOnly ? "border-border/50 bg-secondary/30" : "border-border bg-secondary/50 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20"} transition-all`}>
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none read-only:text-muted-foreground"
        />
        {readOnly && (
          <Shield className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" aria-label="Read-only" />
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSessionState] = useState<DashboardSession | null>(null)

  // Profile fields
  const [fullName,  setFullName]  = useState("")
  const [phone,     setPhone]     = useState("")
  const [username,  setUsername]  = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState("")
  const [booting,  setBooting]  = useState(true)

  // Fetch profile from API
  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/dashboard"); return }
    setSessionState(s)
    fetch(`/api/dashboard/profile?id=${s.id}`)
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) return
        setFullName(user.full_name ?? "")
        setPhone(user.phone ?? "")
        setUsername(user.username ?? "")
        setAvatarUrl(user.avatar_url ?? "")
      })
      .finally(() => setBooting(false))
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setLoading(true); setError(""); setSuccess(false)

    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: session.id,
        fullName,
        phone,
        username,
        avatarUrl,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error ?? "Failed to save."); return }

    // Update session in localStorage so header avatar refreshes
    if (session) {
      const updated = { ...session, fullName, avatarUrl: avatarUrl || undefined } as DashboardSession & { avatarUrl?: string }
      setSession(updated)
      setSessionState(updated)
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (booting) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center pt-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-xl mx-auto px-4">

          {/* Header card */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden mb-6">
            {/* Gold accent bar */}
            <div className="h-1.5 bg-primary w-full" />
            <div className="flex items-center gap-5 px-6 py-6">
              <div className="relative shrink-0">
                <AvatarCircle name={fullName || "U"} avatarUrl={avatarUrl} size={72} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">{fullName || "Your Profile"}</h1>
                <p className="text-sm text-muted-foreground truncate">{session?.email}</p>
                {username && <p className="text-xs text-primary mt-0.5">@{username}</p>}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card px-6 py-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Edit Profile</h2>

            {/* Read-only fields */}
            <Field label="Email" icon={Mail} value={session?.email ?? ""} readOnly />
            <Field label="User ID" icon={Shield} value={session?.userId ?? ""} readOnly />

            {/* Editable fields */}
            <Field
              label="Full Name"
              icon={User}
              value={fullName}
              onChange={setFullName}
              placeholder="Your full name"
            />
            <Field
              label="Username"
              icon={AtSign}
              value={username}
              onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="your_username"
            />
            <Field
              label="Phone"
              icon={Phone}
              value={phone}
              onChange={setPhone}
              placeholder="+1 234 567 890"
              type="tel"
            />
            <Field
              label="Avatar URL"
              icon={Camera}
              value={avatarUrl}
              onChange={setAvatarUrl}
              placeholder="https://..."
            />

            {/* Avatar preview */}
            {avatarUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                <AvatarCircle name={fullName} avatarUrl={avatarUrl} size={40} />
                <p className="text-xs text-muted-foreground">Avatar preview</p>
              </div>
            )}

            {/* Feedback */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 shrink-0" /> Profile saved successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
