"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSession, setSession } from "@/lib/community-utils"
import type { CommunityUser } from "@/lib/community-utils"
import { getMembershipByEmail, getMembershipByUserId, getTradingAccounts, createTradingAccount, deleteTradingAccount, getJournalEntries, createJournalEntry, deleteJournalEntry } from "@/lib/membership-store"
import type { Membership, TradingAccount, JournalEntry } from "@/lib/membership-store"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  LogOut,
  ArrowRight,
  Shield,
  TrendingUp,
  Copy,
  Check,
  Link2,
  Settings,
  Phone,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Wallet,
  BookOpen,
  Plus,
  Trash2,
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
    active:  "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    expired: "bg-red-500/15 text-red-400 border-red-500/30",
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

function Card({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
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
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<CommunityUser | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [payments, setPayments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const [settingsForm, setSettingsForm] = useState({ email: "", phone: "", telegram: "" })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsEditing, setSettingsEditing] = useState(false)

  // Trading Accounts
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [showAccForm, setShowAccForm] = useState(false)
  const [accSaving, setAccSaving] = useState(false)
  const [accForm, setAccForm] = useState({ broker: "", accountType: "live" as TradingAccount["accountType"], accountNumber: "", balance: "", deposit: "", profit: "", currency: "USD", notes: "" })

  // Trading Journal
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [showJForm, setShowJForm] = useState(false)
  const [jSaving, setJSaving] = useState(false)
  const [jForm, setJForm] = useState({ pair: "", direction: "BUY" as "BUY" | "SELL", entryPrice: "", exitPrice: "", lotSize: "", pnl: "", result: "" as JournalEntry["result"] | "", notes: "", tradeDate: new Date().toISOString().slice(0, 10) })

  const loadData = useCallback(async (u: CommunityUser) => {
    setLoading(true)
    let m = await getMembershipByUserId(u.id)
    if (!m) m = await getMembershipByEmail(u.email)
    setMembership(m)
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
    const userId = u.id ?? u.email
    const [accs, jrnl] = await Promise.all([
      getTradingAccounts(userId),
      getJournalEntries(userId),
    ])
    setAccounts(accs)
    setJournal(jrnl)
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
            <div className="w-12 h-12 rounded-xl border-2 border-[#FCD535]/40 bg-secondary flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
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

            {/* 1. Membership Status */}
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
                  <p className="text-sm text-muted-foreground">You don&apos;t have an active membership yet.</p>
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

            {/* 2. Payment History */}
            <Card title="Payment History" icon={<CreditCard className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payment records found.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p, i) => {
                    const details = (p.details as Record<string, string>) ?? {}
                    const date = p.created_at
                      ? new Date(p.created_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"
                    const method = details.paymentMethod ?? details.method ?? (p.type as string) ?? "Payment"
                    const amount = details.amount ?? details.amountPaid ?? "—"
                    const plan   = details.plan ?? details.type ?? (p.type as string) ?? "—"
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

            {/* 3. VIP Signals — only for VIP members */}
            {hasVip && (
              <Card title="VIP Signals" icon={<Crown className="w-4 h-4 text-[#FCD535]" />} defaultOpen={false}>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Access exclusive real-time trade alerts posted by the admin.</p>
                  <Link href="/vip-signals" className="group flex items-center justify-between w-full p-4 rounded-xl bg-[#FCD535]/8 border border-[#FCD535]/25 hover:bg-[#FCD535]/15 transition-colors">
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
                  <Link href="/performance" className="group flex items-center justify-between w-full p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Performance Tracker</p>
                        <p className="text-xs text-muted-foreground">Monthly win rate and profit</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              </Card>
            )}

            {/* 3b. Trading Accounts */}
            <Card title="Trading Accounts" icon={<Wallet className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="space-y-4 pt-1">
                {accounts.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {accounts.map(acc => {
                      const pct = acc.deposit > 0 ? ((acc.profit / acc.deposit) * 100).toFixed(1) : "0"
                      return (
                        <div key={acc.id} className="rounded-xl border border-border bg-secondary/20 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground text-sm">{acc.broker}</p>
                              {acc.accountNumber && <p className="text-xs text-muted-foreground">#{acc.accountNumber}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded border border-border bg-secondary text-muted-foreground capitalize">{acc.accountType}</span>
                              <button onClick={() => deleteTradingAccount(acc.id).then(ok => ok && setAccounts(p => p.filter(a => a.id !== acc.id)))} className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
                            <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-bold text-foreground text-sm">{acc.currency} {acc.balance.toLocaleString()}</p></div>
                            <div><p className="text-xs text-muted-foreground">Deposit</p><p className="font-semibold text-foreground text-sm">{acc.currency} {acc.deposit.toLocaleString()}</p></div>
                            <div><p className="text-xs text-muted-foreground">Return</p><p className={`font-bold text-sm ${acc.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{acc.profit >= 0 ? "+" : ""}{pct}%</p></div>
                          </div>
                          {acc.notes && <p className="text-xs text-muted-foreground">{acc.notes}</p>}
                        </div>
                      )
                    })}
                  </div>
                )}
                {showAccForm ? (
                  <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                    <p className="font-semibold text-foreground text-sm">Add Trading Account</p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { k: "broker",        label: "Broker / Firm",   ph: "XM, FTMO..." },
                        { k: "accountNumber", label: "Account # (opt)", ph: "1234567" },
                        { k: "balance",       label: "Balance",         ph: "10000" },
                        { k: "deposit",       label: "Deposit",         ph: "10000" },
                        { k: "profit",        label: "Total Profit",    ph: "850" },
                        { k: "currency",      label: "Currency",        ph: "USD" },
                      ] as const).map(({ k, label, ph }) => (
                        <div key={k}>
                          <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                          <input value={(accForm as Record<string, string>)[k]} onChange={e => setAccForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Type</label>
                      <select value={accForm.accountType} onChange={e => setAccForm(f => ({ ...f, accountType: e.target.value as TradingAccount["accountType"] }))} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary">
                        {["live", "demo", "funded", "prop"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={accSaving || !accForm.broker}
                        onClick={async () => {
                          if (!user) return
                          setAccSaving(true)
                          const a = await createTradingAccount({ userId: user.id, broker: accForm.broker, accountType: accForm.accountType, accountNumber: accForm.accountNumber || undefined, balance: Number(accForm.balance) || 0, deposit: Number(accForm.deposit) || 0, profit: Number(accForm.profit) || 0, currency: accForm.currency || "USD", notes: accForm.notes || undefined })
                          if (a) { setAccounts(p => [a, ...p]); setShowAccForm(false); setAccForm({ broker: "", accountType: "live", accountNumber: "", balance: "", deposit: "", profit: "", currency: "USD", notes: "" }) }
                          setAccSaving(false)
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >{accSaving ? "Saving..." : "Add Account"}</button>
                      <button onClick={() => setShowAccForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAccForm(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                    <Plus className="w-4 h-4" /> Add Trading Account
                  </button>
                )}
              </div>
            </Card>

            {/* 3c. Trading Journal */}
            <Card title="Trading Journal" icon={<BookOpen className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="space-y-4 pt-1">
                {journal.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Trades", value: String(journal.length), color: "text-foreground" },
                        { label: "Win Rate", value: `${journal.length > 0 ? Math.round((journal.filter(j => j.result === "win").length / journal.length) * 100) : 0}%`, color: "text-green-400" },
                        { label: "Net P&L", value: `$${journal.reduce((s, j) => s + (j.pnl ?? 0), 0).toFixed(2)}`, color: journal.reduce((s, j) => s + (j.pnl ?? 0), 0) >= 0 ? "text-green-400" : "text-red-400" },
                        { label: "W / L", value: `${journal.filter(j => j.result === "win").length} / ${journal.filter(j => j.result === "loss").length}`, color: "text-foreground" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-secondary/30 border-b border-border">
                              {["Date", "Pair", "Dir", "Entry", "Exit", "P&L", "Result", ""].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {journal.map(j => (
                              <tr key={j.id} className="border-b border-border/40 hover:bg-secondary/20">
                                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{j.tradeDate}</td>
                                <td className="px-3 py-2 font-medium text-foreground">{j.pair}</td>
                                <td className="px-3 py-2"><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${j.direction === "BUY" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{j.direction}</span></td>
                                <td className="px-3 py-2 text-xs text-foreground">{j.entryPrice}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">{j.exitPrice ?? "—"}</td>
                                <td className={`px-3 py-2 font-semibold text-xs ${(j.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{j.pnl != null ? `$${j.pnl >= 0 ? "+" : ""}${j.pnl.toFixed(2)}` : "—"}</td>
                                <td className="px-3 py-2"><span className={`text-xs capitalize ${j.result === "win" ? "text-green-400" : j.result === "loss" ? "text-red-400" : "text-muted-foreground"}`}>{j.result ?? "—"}</span></td>
                                <td className="px-3 py-2"><button onClick={() => deleteJournalEntry(j.id).then(ok => ok && setJournal(p => p.filter(x => x.id !== j.id)))} className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
                {showJForm ? (
                  <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                    <p className="font-semibold text-foreground text-sm">Log New Trade</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {([
                        { k: "pair",       label: "Pair",        ph: "XAUUSD" },
                        { k: "entryPrice", label: "Entry Price", ph: "2365.00" },
                        { k: "exitPrice",  label: "Exit Price",  ph: "2385.00" },
                        { k: "lotSize",    label: "Lot Size",    ph: "0.1" },
                        { k: "pnl",        label: "P&L ($)",     ph: "50.00" },
                        { k: "tradeDate",  label: "Date",        ph: "" },
                      ] as const).map(({ k, label, ph }) => (
                        <div key={k}>
                          <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                          <input type={k === "tradeDate" ? "date" : "text"} value={(jForm as Record<string, string>)[k]} onChange={e => setJForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Direction</label>
                        <select value={jForm.direction} onChange={e => setJForm(f => ({ ...f, direction: e.target.value as "BUY" | "SELL" }))} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary">
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Result</label>
                        <select value={jForm.result} onChange={e => setJForm(f => ({ ...f, result: e.target.value as JournalEntry["result"] | "" }))} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary">
                          <option value="">— select —</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="be">Break Even</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Notes (opt)</label>
                      <input value={jForm.notes} onChange={e => setJForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reasoning, emotions, lessons..." className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={jSaving || !jForm.pair || !jForm.entryPrice}
                        onClick={async () => {
                          if (!user) return
                          setJSaving(true)
                          const entry = await createJournalEntry({ userId: user.id, pair: jForm.pair, direction: jForm.direction, entryPrice: Number(jForm.entryPrice), exitPrice: jForm.exitPrice ? Number(jForm.exitPrice) : undefined, lotSize: jForm.lotSize ? Number(jForm.lotSize) : undefined, pnl: jForm.pnl ? Number(jForm.pnl) : undefined, result: (jForm.result || undefined) as JournalEntry["result"] | undefined, notes: jForm.notes || undefined, tradeDate: jForm.tradeDate })
                          if (entry) { setJournal(p => [entry, ...p]); setShowJForm(false); setJForm({ pair: "", direction: "BUY", entryPrice: "", exitPrice: "", lotSize: "", pnl: "", result: "", notes: "", tradeDate: new Date().toISOString().slice(0, 10) }) }
                          setJSaving(false)
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >{jSaving ? "Saving..." : "Log Trade"}</button>
                      <button onClick={() => setShowJForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowJForm(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                    <Plus className="w-4 h-4" /> Log New Trade
                  </button>
                )}
              </div>
            </Card>

            {/* 4. Referral System */}
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
                    {copied
                      ? <><Check className="w-3.5 h-3.5" />Copied</>
                      : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Join OG KAAL TRADER — Professional SMC trading signals & education. ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors text-foreground"
                  >
                    Share via WhatsApp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join OG KAAL TRADER — Professional SMC trading signals & education.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors text-foreground"
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </a>
                </div>
              </div>
            </Card>

            {/* 5. Account Settings */}
            <Card title="Account Settings" icon={<Settings className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
              <div className="space-y-4">
                {!settingsEditing ? (
                  <>
                    <div className="space-y-2">
                      {[
                        { icon: <Mail className="w-3.5 h-3.5" />,  label: "Email",    value: user.email },
                        { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone",    value: user.phone || "Not set" },
                        { icon: <Send className="w-3.5 h-3.5" />,  label: "Telegram", value: settingsForm.telegram || "Not set" },
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
                    {([
                      { key: "email" as const,    label: "Email",             icon: <Mail className="w-4 h-4 text-muted-foreground" />,  type: "email" },
                      { key: "phone" as const,    label: "Phone number",      icon: <Phone className="w-4 h-4 text-muted-foreground" />, type: "tel"   },
                      { key: "telegram" as const, label: "Telegram username", icon: <Send className="w-4 h-4 text-muted-foreground" />,  type: "text"  },
                    ]).map(({ key, label, icon, type }) => (
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
                        onClick={() => {
                          setSettingsEditing(false)
                          setSettingsForm({ email: user.email, phone: user.phone ?? "", telegram: settingsForm.telegram })
                        }}
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

            {/* Performance shortcut for non-VIP users */}
            {!hasVip && (
              <Link href="/performance" className="group flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Performance Tracker</p>
                    <p className="text-xs text-muted-foreground">Monthly win rate and profit charts</p>
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
