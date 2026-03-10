"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSession, setSession } from "@/lib/community-utils"
import type { CommunityUser } from "@/lib/community-utils"
import { getMembershipByEmail, getMembershipByUserId } from "@/lib/membership-store"
import type { Membership } from "@/lib/membership-store"
import { createClient } from "@/lib/supabase/client"
import {
  User, Crown, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, CreditCard, LogOut, ArrowRight, Shield, TrendingUp,
  Copy, Check, Link2, Settings, Phone, Mail, Send,
  ChevronDown, ChevronUp, Pencil, RefreshCw,
} from "lucide-react"

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function daysLeft(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null
  const diff = new Date(expiryDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active:   "bg-green-500/15 text-green-400 border-green-500/30",
    pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    expired:  "bg-red-500/15 text-red-400 border-red-500/30",
  }
  const icons: Record<string, React.ReactNode> = {
    active:  <CheckCircle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
    expired: <XCircle className="w-3 h-3" />,
  }
  const cls = variants[status] ?? "bg-secondary text-muted-foreground border-border"
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${cls}`}>
      {icons[status] ?? <AlertCircle className="w-3 h-3" />}
      {status === "active" ? "Active" : status === "pending" ? "Pending Verification" : status === "expired" ? "Expired" : "No Plan"}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Approved</span>
  if (status === "rejected")
    return <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Rejected</span>
  return <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Pending</span>
}

interface SectionCard {
  id: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function Card({ title, icon, children, defaultOpen = true }: Omit<SectionCard, "id">) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<CommunityUser | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [payments, setPayments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Account settings state
  const [settingsForm, setSettingsForm] = useState({ email: "", phone: "", telegram: "" })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsEditing, setSettingsEditing] = useState(false)

  const loadData = useCallback(async (u: CommunityUser) => {
    setLoading(true)
    // Load membership
    let m = await getMembershipByUserId(u.id)
    if (!m) m = await getMembershipByEmail(u.email)
    setMembership(m)

    // Load payment history from admin_submissions in Supabase
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("admin_submissions")
        .select("*")
        .or(`email.eq.${u.email},details->>email.eq.${u.email}`)
        .order("created_at", { ascending: false })
        .limit(20)
      setPayments(data ?? [])
    } catch {
      setPayments([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const u = getSession()
    if (!u) { router.replace("/community"); return }
    setUser(u)
    setSettingsForm({ email: u.email, phone: u.phone ?? "", telegram: "" })
    loadData(u)
  }, [router, loadData])

  function handleLogout() {
    setSession(null)
    router.push("/")
  }

  function handleCopyReferral() {
    if (!user) return
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/community?ref=${user.id}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSaveSettings() {
    if (!user) return
    const updated: CommunityUser = {
      ...user,
      email: settingsForm.email || user.email,
      phone: settingsForm.phone || user.phone,
    }
    setSession(updated)
    setUser(updated)
    setSettingsSaved(true)
    setSettingsEditing(false)
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  if (!user) return null

  const days = membership ? daysLeft(membership.expiryDate) : null
  const isActive = membership?.status === "active"
  const hasVip = isActive && (membership?.plan === "VIP" || membership?.plan === "VIP Group")
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/community?ref=${user.id}`
    : `/community?ref=${user.id}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">

        {/* Top bar */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-12 h-12 rounded-xl border-2 border-[#FCD535]/40 shrink-0"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{user.fullName}</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FCD535]/10 text-[#FCD535] border border-[#FCD535]/30">
                {user.level}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => user && loadData(user)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">

            {/* 1. Membership Status Card */}
            <Card title="Membership Status" icon={<Crown className="w-4 h-4 text-[#FCD535]" />}>
              {membership ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${membership.plan === "VIP" || membership.plan === "VIP Group" ? "bg-[#FCD535]/15" : "bg-blue-500/15"}`}>
                        {membership.plan === "VIP" || membership.plan === "VIP Group"
                          ? <Crown className="w-5 h-5 text-[#FCD535]" />
                          : <Shield className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{membership.plan}</p>
                        <p className="text-xs text-muted-foreground">Trading Plan</p>
                      </div>
                    </div>
                    <StatusBadge status={membership.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Joined</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatDate(membership.joinDate)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Expires</span>
                      </div>
                      <p className={`text-sm font-semibold ${days !== null && days <= 7 ? "text-red-400" : days !== null && days <= 30 ? "text-yellow-400" : "text-foreground"}`}>
                        {formatDate(membership.expiryDate)}
                        {days !== null && days > 0 && <span className="text-xs ml-1.5 opacity-70">({days}d left)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Status alerts */}
                  {days !== null && days > 0 && days <= 30 && (
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-300">Membership expires in <strong>{days} day{days !== 1 ? "s" : ""}</strong>. Renew soon to avoid losing access.</p>
                    </div>
                  )}
                  {membership.status === "expired" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-300">Your membership has expired. VIP content is currently hidden.</p>
                        <Link href="/vip-group" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#FCD535] hover:underline">
                          Renew now <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                  {membership.status === "pending" && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-300">Payment is under review. You will be added once verified by admin.</p>
                    </div>
                  )}

                  {/* VIP signals quick-access */}
                  {hasVip && (
                    <Link href="/vip-signals" className="group flex items-center justify-between p-3 rounded-xl bg-[#FCD535]/8 border border-[#FCD535]/25 hover:bg-[#FCD535]/15 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <Crown className="w-4 h-4 text-[#FCD535]" />
                        <span className="text-sm font-semibold text-foreground">View VIP Signals</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">You don't have an active membership yet.</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/vip-group" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FCD535] text-black font-semibold text-sm hover:bg-[#FCD535]/90 transition-colors">
                      <Crown className="w-4 h-4" />Get VIP Access
                    </Link>
                    <Link href="/mentorship" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors">
                      <Shield className="w-4 h-4" />Mentorship
                    </Link>
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Payment History Card */}
            <Card title="Payment History" icon={<CreditCard className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payment records found.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p, i) => {
                    const details = (p.details as Record<string, string>) ?? {}
                    const date = p.created_at ? new Date(p.created_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
                    const method = details.paymentMethod ?? details.method ?? (p.type as string) ?? "Payment"
                    const amount = details.amount ?? details.amountPaid ?? "—"
                    const plan = details.plan ?? details.type ?? (p.type as string) ?? "—"
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate capitalize">{String(plan).replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{date} · {String(method).toUpperCase()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {amount !== "—" && <p className="text-sm font-bold text-foreground">{amount}</p>}
                          <PaymentStatusBadge status={String(p.status ?? "pending")} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* 3. VIP Signals Card — only for VIP members */}
            {hasVip && (
              <Card title="VIP Signals" icon={<Crown className="w-4 h-4 text-[#FCD535]" />} defaultOpen={false}>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Access exclusive real-time trade alerts posted by the admin.</p>
                  <Link
                    href="/vip-signals"
                    className="group flex items-center justify-between w-full p-4 rounded-xl bg-[#FCD535]/8 border border-[#FCD535]/25 hover:bg-[#FCD535]/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FCD535]/15 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#FCD535]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Open VIP Signals</p>
                        <p className="text-xs text-muted-foreground">Live trade alerts</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <Link
                    href="/performance"
                    className="group flex items-center justify-between w-full p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Performance Tracker</p>
                        <p className="text-xs text-muted-foreground">Monthly win rate & profit</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              </Card>
            )}

            {/* 4. Referral System Card */}
            <Card title="Referral System" icon={<Link2 className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share your referral link to invite traders to OG KAAL TRADER. Your link is unique to your account.
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground font-mono flex-1 truncate">{referralLink}</p>
                  <button
                    onClick={handleCopyReferral}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Join OG KAAL TRADER — Professional SMC trading signals & education. ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    Share via WhatsApp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join OG KAAL TRADER — Professional SMC trading signals & education.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </a>
                </div>
              </div>
            </Card>

            {/* 5. Account Settings Card */}
            <Card title="Account Settings" icon={<Settings className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="space-y-4">
                {!settingsEditing ? (
                  <>
                    <div className="space-y-2">
                      {[
                        { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", value: user.email },
                        { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", value: user.phone || "Not set" },
                        { icon: <Send className="w-3.5 h-3.5" />, label: "Telegram", value: settingsForm.telegram || "Not set" },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                          <div className="text-muted-foreground">{icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-sm font-medium text-foreground truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setSettingsEditing(true)}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit details
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {[
                      { key: "email" as const, label: "Email", icon: <Mail className="w-4 h-4 text-muted-foreground" />, type: "email" },
                      { key: "phone" as const, label: "Phone number", icon: <Phone className="w-4 h-4 text-muted-foreground" />, type: "tel" },
                      { key: "telegram" as const, label: "Telegram username", icon: <Send className="w-4 h-4 text-muted-foreground" />, type: "text" },
                    ].map(({ key, label, icon, type }) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border">
                          {icon}
                          <input
                            type={type}
                            value={settingsForm[key]}
                            onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={label}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleSaveSettings}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => { setSettingsEditing(false); setSettingsForm({ email: user.email, phone: user.phone ?? "", telegram: settingsForm.telegram }) }}
                        className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {settingsSaved && (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Changes saved successfully.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Performance shortcut for all logged-in users */}
            {!hasVip && (
              <Link href="/performance" className="group flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Performance Tracker</p>
                    <p className="text-xs text-muted-foreground">Monthly win rate & profit charts</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}

          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
