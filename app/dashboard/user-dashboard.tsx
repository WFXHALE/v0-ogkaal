"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSession, setSession } from "@/lib/community-utils"
import type { CommunityUser } from "@/lib/community-utils"
import { getMembershipByEmail, getMembershipByUserId } from "@/lib/membership-store"
import type { Membership } from "@/lib/membership-store"
import { createClient } from "@/lib/supabase/client"
import {
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  LogOut,
  Shield,
  Copy,
  Check,
  Link2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  BookOpen,
  ArrowRight,
  Send,
  BarChart2,
  ShoppingCart,
  TrendingDown,
  Activity,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function daysLeft(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    active:   { cls: "bg-green-500/15 text-green-400 border-green-500/30",  icon: <CheckCircle className="w-3 h-3" />, label: "Active"               },
    pending:  { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" />,       label: "Pending Verification"  },
    expired:  { cls: "bg-red-500/15 text-red-400 border-red-500/30",        icon: <XCircle className="w-3 h-3" />,     label: "Expired"               },
  }
  const v = map[status] ?? { cls: "bg-secondary text-muted-foreground border-border", icon: <AlertCircle className="w-3 h-3" />, label: "No Plan" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${v.cls}`}>
      {v.icon}{v.label}
    </span>
  )
}

function PayBadge({ status }: { status: string }) {
  if (status === "approved") return <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Approved</span>
  if (status === "rejected") return <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Rejected</span>
  return <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>
}

function Card({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">{icon}</div>
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  )
}

function MembershipBlock({
  label, icon, iconBg, membership, renewHref,
}: {
  label: string
  icon: React.ReactNode
  iconBg: string
  membership: Membership | null
  renewHref: string
}) {
  const days = daysLeft(membership?.expiryDate)
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
          <div>
            <p className="font-bold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{membership?.plan ?? "Not enrolled"}</p>
          </div>
        </div>
        <StatusBadge status={membership?.status ?? "none"} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-1.5 mb-0.5"><Calendar className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Entry Date</span></div>
          <p className="text-sm font-semibold text-foreground">{fmt(membership?.joinDate)}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-1.5 mb-0.5"><Clock className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Expiry Date</span></div>
          <p className={`text-sm font-semibold ${days !== null && days <= 7 ? "text-red-400" : days !== null && days <= 30 ? "text-yellow-400" : "text-foreground"}`}>
            {fmt(membership?.expiryDate)}
            {days !== null && days > 0 && <span className="text-xs ml-1 opacity-60">({days}d)</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={renewHref} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Renew Membership
        </Link>
        <Link href={renewHref} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Clock className="w-3.5 h-3.5" /> Extend Time
        </Link>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [user, setUser]               = useState<CommunityUser | null>(null)
  const [notLoggedIn, setNotLoggedIn] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [copied, setCopied]           = useState(false)

  const [vipMembership, setVipMembership]           = useState<Membership | null>(null)
  const [mentorMembership, setMentorMembership]     = useState<Membership | null>(null)
  const [payments, setPayments]                     = useState<Record<string, unknown>[]>([])
  const [usdtBuy, setUsdtBuy]                       = useState<Record<string, unknown>[]>([])
  const [usdtSell, setUsdtSell]                     = useState<Record<string, unknown>[]>([])
  const [telegramPosts, setTelegramPosts]           = useState<{ id: string; text: string; date: number; photo?: string }[]>([])
  const [telegramLoading, setTelegramLoading]       = useState(false)
  const [referralPoints, setReferralPoints]         = useState(0)

  const loadData = useCallback(async (u: CommunityUser) => {
    setLoading(true)
    const supabase = createClient()

    // Load memberships — VIP and Mentorship separately
    const allMemberships = await (async () => {
      const { data } = await supabase
        .from("memberships")
        .select("*")
        .or(`email.eq.${u.email},user_id.eq.${u.id}`)
        .order("created_at", { ascending: false })
      return data ?? []
    })()

    const vip = allMemberships.find((m: Record<string, unknown>) =>
      String(m.plan ?? "").toLowerCase().includes("vip")
    )
    const mentor = allMemberships.find((m: Record<string, unknown>) =>
      String(m.plan ?? "").toLowerCase().includes("mentor")
    )

    const mapM = (row: Record<string, unknown>): Membership => ({
      id: String(row.id),
      userId: String(row.user_id ?? ""),
      userEmail: String(row.email ?? ""),
      userName: String(row.name ?? ""),
      plan: String(row.plan ?? "Free") as Membership["plan"],
      status: String(row.status ?? "none") as Membership["status"],
      joinDate: String(row.joined_at ?? row.created_at ?? ""),
      expiryDate: row.expires_at ? String(row.expires_at) : null,
      paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
      amountPaid: row.amount ? String(row.amount) : undefined,
      createdAt: String(row.created_at ?? ""),
    })

    setVipMembership(vip ? mapM(vip as Record<string, unknown>) : null)
    setMentorMembership(mentor ? mapM(mentor as Record<string, unknown>) : null)

    // Payment history from admin_submissions
    const { data: payData } = await supabase
      .from("admin_submissions")
      .select("id,created_at,payment_method,amount,status,utr,type")
      .or(`email.eq.${u.email},user_id.eq.${u.id}`)
      .order("created_at", { ascending: false })
      .limit(30)
    setPayments(payData ?? [])

    // USDT P2P orders
    const [{ data: buyData }, { data: sellData }] = await Promise.all([
      supabase.from("usdt_buy_requests").select("*").or(`email.eq.${u.email},user_id.eq.${u.id}`).order("created_at", { ascending: false }),
      supabase.from("usdt_sell_requests").select("*").or(`email.eq.${u.email},user_id.eq.${u.id}`).order("created_at", { ascending: false }),
    ])
    setUsdtBuy(buyData ?? [])
    setUsdtSell(sellData ?? [])

    // Referral points: count users who signed up with this user's ref
    const { count } = await supabase
      .from("community_users")
      .select("id", { count: "exact", head: true })
      .eq("bio", `ref:${u.id}`)
    setReferralPoints((count ?? 0) * 100)

    setLoading(false)
  }, [])

  useEffect(() => {
    const u = getSession()
    if (!u) { setNotLoggedIn(true); setLoading(false); return }
    setUser(u)
    loadData(u)
  }, [loadData])

  // Telegram feed — fetch public posts from community_posts by admin
  useEffect(() => {
    if (!user) return
    setTelegramLoading(true)
    const supabase = createClient()
    supabase
      .from("community_posts")
      .select("id,content,image_url,created_at,author_name")
      .eq("is_admin_post", true)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTelegramPosts(
          (data ?? []).map((p: Record<string, unknown>) => ({
            id: String(p.id),
            text: String(p.content ?? ""),
            date: new Date(String(p.created_at)).getTime() / 1000,
            photo: p.image_url ? String(p.image_url) : undefined,
          }))
        )
        setTelegramLoading(false)
      })
  }, [user])

  function handleLogout() {
    setSession(null)
    setUser(null)
    setNotLoggedIn(true)
  }

  function handleCopyReferral() {
    if (!user) return
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/community?ref=${user.id}`
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  // Not logged in view
  if (!loading && notLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">Client Dashboard</h1>
              <p className="text-sm text-muted-foreground">Sign in to access your membership, payments, and activity.</p>
            </div>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Sign In via Community <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) return null

  const hasVip      = vipMembership?.status === "active"
  const hasMentor   = mentorMembership?.status === "active"
  const allOrders   = [
    ...(usdtBuy.map(o => ({ ...o, orderType: "Buy" }))),
    ...(usdtSell.map(o => ({ ...o, orderType: "Sell" }))),
  ].sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())

  const usdtStats = {
    totalBuy:     usdtBuy.length,
    totalSell:    usdtSell.length,
    successful:   allOrders.filter(o => String(o.status) === "approved").length,
    pending:      allOrders.filter(o => String(o.status) === "pending").length,
    failed:       allOrders.filter(o => String(o.status) === "rejected").length,
  }

  const payStats = {
    pending:  payments.filter(p => String(p.status) === "pending").length,
    approved: payments.filter(p => String(p.status) === "approved").length,
    rejected: payments.filter(p => String(p.status) === "rejected").length,
  }

  const discountPct = Math.min(Math.floor(referralPoints / 100) * 2, 20)
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/community?ref=${user.id}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border-2 border-[#FCD535]/40 bg-secondary flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Client Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadData(user)}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">

            {/* 1. My Membership */}
            <Card title="My Membership" icon={<Crown className="w-4 h-4 text-[#FCD535]" />}>
              <div className="space-y-3 pt-1">
                <MembershipBlock
                  label="VIP Membership"
                  icon={<Crown className="w-4 h-4 text-[#FCD535]" />}
                  iconBg="bg-[#FCD535]/15"
                  membership={vipMembership}
                  renewHref="/vip-group"
                />
                <MembershipBlock
                  label="Mentorship Membership"
                  icon={<Shield className="w-4 h-4 text-blue-400" />}
                  iconBg="bg-blue-500/15"
                  membership={mentorMembership}
                  renewHref="/mentorship"
                />
              </div>
            </Card>

            {/* 2. Payment Status */}
            <Card title="Payment Status" icon={<Activity className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { label: "Pending",  value: payStats.pending,  cls: "text-yellow-400", bg: "bg-yellow-500/10" },
                  { label: "Approved", value: payStats.approved, cls: "text-green-400",  bg: "bg-green-500/10"  },
                  { label: "Rejected", value: payStats.rejected, cls: "text-red-400",    bg: "bg-red-500/10"    },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border border-border ${s.bg} p-4 text-center`}>
                    <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Payment History */}
            <Card title="Payment History" icon={<CreditCard className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="pt-1">
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No payment records found.</p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/30 border-b border-border">
                            {["Date", "Method", "Amount", "Txn ID", "Status"].map(h => (
                              <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-secondary/20">
                              <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                {p.created_at ? new Date(String(p.created_at)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-foreground">{String(p.payment_method ?? "—")}</td>
                              <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{p.amount ? `₹${p.amount}` : "—"}</td>
                              <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{String(p.utr ?? "—")}</td>
                              <td className="px-3 py-2.5"><PayBadge status={String(p.status ?? "pending")} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* 4. VIP Group Access */}
            <Card title="VIP Group Access" icon={<Crown className="w-4 h-4 text-[#FCD535]" />} defaultOpen={false}>
              <div className="pt-1 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasVip ? "bg-[#FCD535]/15" : "bg-secondary"}`}>
                      <Crown className={`w-5 h-5 ${hasVip ? "text-[#FCD535]" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">VIP Group Access</p>
                      <p className="text-xs text-muted-foreground">Real-time signals &amp; alerts</p>
                    </div>
                  </div>
                  <StatusBadge status={vipMembership?.status ?? "none"} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">VIP Entry Date</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(vipMembership?.joinDate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">VIP Expiry Date</p>
                    <p className={`text-sm font-semibold ${(() => { const d = daysLeft(vipMembership?.expiryDate); return d !== null && d <= 7 ? "text-red-400" : d !== null && d <= 30 ? "text-yellow-400" : "text-foreground" })()}`}>
                      {fmt(vipMembership?.expiryDate)}
                    </p>
                  </div>
                </div>
                {hasVip ? (
                  <Link href="/vip-signals" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FCD535]/10 border border-[#FCD535]/20 text-[#FCD535] text-sm font-semibold hover:bg-[#FCD535]/20 transition-colors">
                    View VIP Signals <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link href="/vip-group" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-muted-foreground text-sm hover:text-foreground transition-colors">
                    Upgrade to VIP <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </Card>

            {/* 5. Mentorship Content */}
            <Card title="Mentorship Content" icon={<BookOpen className="w-4 h-4 text-blue-400" />} defaultOpen={false}>
              <div className="pt-1 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasMentor ? "bg-blue-500/15" : "bg-secondary"}`}>
                      <BookOpen className={`w-5 h-5 ${hasMentor ? "text-blue-400" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Mentorship Access</p>
                      <p className="text-xs text-muted-foreground">SMC, funded accounts &amp; live sessions</p>
                    </div>
                  </div>
                  <StatusBadge status={mentorMembership?.status ?? "none"} />
                </div>

                {hasMentor ? (
                  <div className="space-y-2">
                    {[
                      { label: "Module 1 — SMC Foundations",       href: "/material" },
                      { label: "Module 2 — Order Block Trading",    href: "/material" },
                      { label: "Module 3 — Liquidity Concepts",     href: "/material" },
                      { label: "Module 4 — Funded Account Strategy",href: "/material" },
                      { label: "Module 5 — Risk Management",        href: "/material" },
                    ].map((m, i) => (
                      <Link key={i} href={m.href} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-secondary/30 group transition-colors">
                        <span className="text-sm font-medium text-foreground">{m.label}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </Link>
                    ))}
                    <Link href="/mentorship" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-colors mt-2">
                      View All Materials <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">Enroll in the Mentorship program to access all learning materials.</p>
                    <Link href="/mentorship" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                      Enroll in Mentorship <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* 6. P2P / USDT Activity */}
            <Card title="USDT / P2P Activity" icon={<BarChart2 className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="pt-1 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Buy Orders",    value: usdtStats.totalBuy,   icon: <ShoppingCart className="w-4 h-4" />, cls: "text-blue-400",   bg: "bg-blue-500/10"   },
                    { label: "Sell Orders",   value: usdtStats.totalSell,  icon: <TrendingDown className="w-4 h-4" />,  cls: "text-purple-400", bg: "bg-purple-500/10" },
                    { label: "Successful",    value: usdtStats.successful, icon: <CheckCircle className="w-4 h-4" />, cls: "text-green-400",  bg: "bg-green-500/10"  },
                    { label: "Pending",       value: usdtStats.pending,    icon: <Clock className="w-4 h-4" />,        cls: "text-yellow-400", bg: "bg-yellow-500/10" },
                    { label: "Failed",        value: usdtStats.failed,     icon: <XCircle className="w-4 h-4" />,      cls: "text-red-400",    bg: "bg-red-500/10"    },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl border border-border ${s.bg} p-3`}>
                      <div className={`${s.cls} mb-1`}>{s.icon}</div>
                      <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                {allOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No P2P transactions yet.</p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/30 border-b border-border">
                            {["Date", "Type", "Amount (USDT)", "Status"].map(h => (
                              <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allOrders.slice(0, 20).map((o, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-secondary/20">
                              <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(String(o.created_at)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.orderType === "Buy" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>
                                  {String(o.orderType)}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-xs font-semibold text-foreground">{String(o.amount_usdt ?? "—")} USDT</td>
                              <td className="px-3 py-2.5"><PayBadge status={String(o.status ?? "pending")} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <Link href="/usdt-p2p" className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  Go to USDT P2P <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>

            {/* 7. Live Telegram Feed */}
            <Card title="Latest Updates" icon={<Send className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="pt-1 space-y-3">
                {telegramLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />)}
                  </div>
                ) : telegramPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No admin updates yet.</p>
                ) : (
                  telegramPosts.map(post => (
                    <div key={post.id} className="rounded-xl border border-border bg-secondary/20 p-4 space-y-2">
                      {post.photo && (
                        <img src={post.photo} alt="Post image" className="w-full rounded-lg object-cover max-h-48" />
                      )}
                      <p className="text-sm text-foreground leading-relaxed">{post.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.date * 1000).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 8. Referral Program */}
            <Card title="Referral Program" icon={<Link2 className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="pt-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-[#FCD535]/5 p-4 text-center">
                    <p className="text-2xl font-bold text-[#FCD535]">{referralPoints}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Referral Points</p>
                  </div>
                  <div className="rounded-xl border border-border bg-green-500/5 p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{discountPct}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Discount Earned</p>
                  </div>
                </div>
                <div className="rounded-xl bg-secondary/40 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Your Referral Link</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-foreground font-mono flex-1 truncate">{referralLink}</p>
                    <button
                      onClick={handleCopyReferral}
                      className="shrink-0 p-2 rounded-lg bg-secondary border border-border hover:bg-secondary/70 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share your referral link. Every user who joins earns you <span className="text-foreground font-semibold">100 points</span>. 
                  100 points = <span className="text-foreground font-semibold">2% discount</span> on your next membership renewal.
                </p>
              </div>
            </Card>

          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
