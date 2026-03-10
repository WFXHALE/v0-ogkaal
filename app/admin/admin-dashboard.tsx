"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, LogOut, RefreshCw, Trash2, CheckCircle, Clock,
  Users, FileText, Star, BarChart2, Settings,
  Activity, X, ChevronRight, DollarSign, TrendingUp,
  Eye, Ban, AlertCircle, Hash,
  AlertTriangle, UserCheck, UserX, ChevronDown, ChevronUp,
  Image as ImageIcon, Bell, BellOff, Search, Download,
  ArrowUpRight, ArrowDownLeft, Menu, Folder, Lock,
  Globe, ToggleLeft, ToggleRight, Mail, Phone,
  ExternalLink, CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { isSessionValid, logout, getSession, getSecurityLogs, changePassword } from "@/lib/admin-auth"
import type { SecurityLog } from "@/lib/admin-auth"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard" | "usdt-buy" | "usdt-sell"
  | "payment-verification" | "suspicious" | "members"
  | "notifications" | "security" | "files"
  | "export" | "system-control" | "logs"

interface Submission {
  id: string
  userId?: string
  type: "usdt_p2p" | "funded_account" | "mentorship" | "vip" | "vip_group" | "other"
  name: string
  email?: string
  telegram?: string
  phone?: string
  details: Record<string, unknown>
  status: "pending" | "approved" | "rejected" | "completed"
  paymentMethod?: string
  amount?: string
  utr?: string
  screenshotUrl?: string
  walletAddress?: string
  upiId?: string
  inrEquivalent?: string
  amountPaid?: string
  ipAddress: string
  location: string
  createdAt: string
}

interface USDTBuyRequest {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  walletAddress: string
  txId: string
  screenshotUrl: string
  amountUsdt: string
  inrEquivalent: string
  amountPaid: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface USDTSellRequest {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  upiId: string
  walletAddress: string
  usdtAmount: string
  txId: string
  screenshotUrl: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface AdminNotification {
  id: string
  type: "vip" | "mentorship" | "usdt" | "suspicious"
  message: string
  read: boolean
  createdAt: string
}

// ─── Sidebar config ───────────────────────────────────────────────────────────

const NAV: { key: Section; label: string; icon: typeof Shield; group?: string }[] = [
  { key: "dashboard",             label: "Dashboard",              icon: BarChart2 },
  { key: "payment-verification",  label: "Payment Verification",   icon: CheckCircle },
  { key: "usdt-buy",              label: "USDT Buy Requests",      icon: ArrowDownLeft,  group: "USDT Trading" },
  { key: "usdt-sell",             label: "USDT Sell Requests",     icon: ArrowUpRight,   group: "USDT Trading" },
  { key: "suspicious",            label: "Fraud Detection",        icon: AlertTriangle },
  { key: "members",               label: "Member Database",        icon: Users },
  { key: "notifications",         label: "Notifications",          icon: Bell },
  { key: "files",                 label: "File Manager",           icon: Folder },
  { key: "export",                label: "Export Data",            icon: Download },
  { key: "system-control",        label: "System Control",         icon: Globe },
  { key: "security",              label: "Security Settings",      icon: Lock },
  { key: "logs",                  label: "Admin Logs",             icon: Activity },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function uid(index: number) { return `USER-${String(index + 1).padStart(4, "0")}` }

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:   "bg-amber-500/10 text-amber-400 border-amber-500/30",
    approved:  "bg-green-500/10 text-green-400 border-green-500/30",
    rejected:  "bg-red-500/10 text-red-400 border-red-500/30",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  }
  return map[status] || "bg-secondary text-foreground border-border"
}

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SUBMISSIONS: Submission[] = [
  {
    id: "1", userId: "USER-0001", type: "mentorship", name: "Rahul Kumar",
    email: "rahul@example.com", telegram: "@rahulk", phone: "+91 76543 21098",
    details: { program: "Mentorship 2.0", experience: "Beginner" },
    status: "pending", paymentMethod: "UPI", amount: "₹4,999", utr: "UTR123456789",
    screenshotUrl: "", ipAddress: "49.207.89.123", location: "Bangalore, India",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2", userId: "USER-0002", type: "vip_group", name: "Jane Smith",
    email: "jane@example.com", telegram: "@janesmith", phone: "+91 87654 32109",
    details: { plan: "VIP Group", duration: "Monthly" },
    status: "pending", paymentMethod: "USDT TRC20", amount: "$29",
    utr: "UTR123456789", screenshotUrl: "", ipAddress: "182.73.45.12", location: "Delhi, India",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3", userId: "USER-0001", type: "usdt_p2p", name: "Rahul Kumar",
    telegram: "@rahulk", phone: "+91 98765 43210",
    details: { action: "buy", amount: "500 USDT" },
    status: "completed", paymentMethod: "UPI", amount: "₹41,000", utr: "UTR123456789",
    ipAddress: "103.45.67.89", location: "Mumbai, India",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4", userId: "USER-0003", type: "vip", name: "Priya Singh",
    email: "priya@example.com", telegram: "@priyasingh", phone: "+91 90012 34567",
    details: { plan: "VIP Signals" },
    status: "approved", paymentMethod: "UPI", amount: "₹2,999", utr: "UTR987654321",
    screenshotUrl: "", ipAddress: "122.45.12.89", location: "Chennai, India",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const DEMO_BUY: USDTBuyRequest[] = [
  {
    id: "b1", userId: "USER-0001", name: "Rahul Kumar", email: "rahul@example.com",
    phone: "+91 76543 21098", walletAddress: "TF7gytsAtFPM9f2RQPyiFphd8pasiZ1WQF",
    txId: "ABC123TX", screenshotUrl: "", amountUsdt: "500", inrEquivalent: "₹41,750",
    amountPaid: "₹41,750", status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

const DEMO_SELL: USDTSellRequest[] = [
  {
    id: "s1", userId: "USER-0002", name: "Jane Smith", email: "jane@example.com",
    phone: "+91 87654 32109", upiId: "jane@upi", walletAddress: "TF7gytsAtFPM9f2RQPy...",
    usdtAmount: "200", txId: "TX9988SELL", screenshotUrl: "", status: "pending",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
]

const DEMO_NOTIFICATIONS: AdminNotification[] = [
  { id: "n1", type: "vip", message: "New VIP payment received from Priya Singh", read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "n2", type: "mentorship", message: "New Mentorship payment received from Rahul Kumar", read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "n3", type: "usdt", message: "New USDT trade request submitted by Jane Smith", read: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
]

const DEFAULT_SYSTEM = {
  upiEnabled: true,
  cryptoEnabled: true,
  erupeeEnabled: true,
  vipPrice: "₹2,999",
  mentorshipPrice: "₹4,999",
  maintenanceMode: false,
  paymentInstructions: "Pay via UPI or Crypto and upload screenshot with UTR number.",
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail]           = useState("")
  const [isLoading, setIsLoading]             = useState(true)
  const [activeSection, setActiveSection]     = useState<Section>("dashboard")
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [usdtOpen, setUsdtOpen]               = useState(false)
  const [mounted, setMounted]                 = useState(false)

  const [submissions, setSubmissions]         = useState<Submission[]>([])
  const [usdtBuy, setUsdtBuy]                 = useState<USDTBuyRequest[]>([])
  const [usdtSell, setUsdtSell]               = useState<USDTSellRequest[]>([])
  const [notifications, setNotifications]     = useState<AdminNotification[]>([])
  const [securityLogs, setSecurityLogs]       = useState<SecurityLog[]>([])
  const [systemSettings, setSystemSettings]   = useState(DEFAULT_SYSTEM)

  const [screenshotModal, setScreenshotModal] = useState<string | null>(null)
  const [detailView, setDetailView]           = useState<Submission | null>(null)
  const [memberSearch, setMemberSearch]       = useState("")
  const [notifEnabled, setNotifEnabled]       = useState(true)
  const [secForm, setSecForm]                 = useState({ name: "", email: "", phone: "", oldPw: "", newPw: "", confirmPw: "" })
  const [secMsg, setSecMsg]                   = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const loadData = useCallback(() => {
    const stored = localStorage.getItem("og_admin_submissions")
    setSubmissions(stored ? JSON.parse(stored) : DEMO_SUBMISSIONS)
    if (!stored) localStorage.setItem("og_admin_submissions", JSON.stringify(DEMO_SUBMISSIONS))

    const buyStored = localStorage.getItem("og_admin_usdt_buy")
    setUsdtBuy(buyStored ? JSON.parse(buyStored) : DEMO_BUY)
    if (!buyStored) localStorage.setItem("og_admin_usdt_buy", JSON.stringify(DEMO_BUY))

    const sellStored = localStorage.getItem("og_admin_usdt_sell")
    setUsdtSell(sellStored ? JSON.parse(sellStored) : DEMO_SELL)
    if (!sellStored) localStorage.setItem("og_admin_usdt_sell", JSON.stringify(DEMO_SELL))

    const notifStored = localStorage.getItem("og_admin_notifications")
    setNotifications(notifStored ? JSON.parse(notifStored) : DEMO_NOTIFICATIONS)
    if (!notifStored) localStorage.setItem("og_admin_notifications", JSON.stringify(DEMO_NOTIFICATIONS))

    const sysStored = localStorage.getItem("og_admin_system")
    if (sysStored) setSystemSettings(JSON.parse(sysStored))

    setSecurityLogs(getSecurityLogs())
  }, [])

  useEffect(() => {
    setMounted(true)
    if (!isSessionValid()) { router.push("/admin/login"); return }
    const session = getSession()
    if (session) {
      setAdminEmail(session.email)
      setSecForm(f => ({ ...f, name: session.username || "", email: session.email }))
    }
    setIsAuthenticated(true)
    setIsLoading(false)
    loadData()
  }, [router, loadData])

  const saveSubmissions = (updated: Submission[]) => {
    setSubmissions(updated)
    localStorage.setItem("og_admin_submissions", JSON.stringify(updated))
  }

  const updateStatus = (id: string, status: Submission["status"]) => {
    saveSubmissions(submissions.map(s => s.id === id ? { ...s, status } : s))
    if (detailView?.id === id) setDetailView(prev => prev ? { ...prev, status } : null)
  }

  const deleteSubmission = (id: string) => {
    if (!confirm("Delete this submission?")) return
    saveSubmissions(submissions.filter(s => s.id !== id))
  }

  const updateBuyStatus = (id: string, status: USDTBuyRequest["status"]) => {
    const updated = usdtBuy.map(r => r.id === id ? { ...r, status } : r)
    setUsdtBuy(updated); localStorage.setItem("og_admin_usdt_buy", JSON.stringify(updated))
  }

  const updateSellStatus = (id: string, status: USDTSellRequest["status"]) => {
    const updated = usdtSell.map(r => r.id === id ? { ...r, status } : r)
    setUsdtSell(updated); localStorage.setItem("og_admin_usdt_sell", JSON.stringify(updated))
  }

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated); localStorage.setItem("og_admin_notifications", JSON.stringify(updated))
  }

  const saveSystem = (patch: Partial<typeof DEFAULT_SYSTEM>) => {
    const updated = { ...systemSettings, ...patch }
    setSystemSettings(updated); localStorage.setItem("og_admin_system", JSON.stringify(updated))
  }

  const handleLogout = async () => { await logout(); router.push("/admin/login") }

  const fmtDate = (d: string) => {
    if (!mounted) return ""
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const pendingSubs    = submissions.filter(s => s.status === "pending")
  const vipSubs        = submissions.filter(s => s.type === "vip" || s.type === "vip_group")
  const mentorSubs     = submissions.filter(s => s.type === "mentorship")
  const utrCounts: Record<string, string[]> = {}
  submissions.forEach(s => { if (s.utr) { utrCounts[s.utr] = utrCounts[s.utr] || []; utrCounts[s.utr].push(s.id) } })
  const suspiciousSubs = submissions.filter(s => s.utr && utrCounts[s.utr]?.length > 1)
  const unreadCount    = notifications.filter(n => !n.read).length

  const userList = submissions.reduce<Submission[]>((acc, s) => {
    if (!acc.find(a => a.userId === s.userId)) acc.push(s)
    return acc
  }, [])

  const filteredMembers = memberSearch.trim()
    ? userList.filter(u =>
        u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.telegram?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.phone?.includes(memberSearch) ||
        u.userId?.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : userList

  const allFiles = [
    ...submissions.filter(s => s.screenshotUrl).map(s => ({ id: s.id, userId: s.userId || "—", name: s.name, type: "Payment Screenshot", url: s.screenshotUrl!, createdAt: s.createdAt })),
    ...usdtBuy.filter(r => r.screenshotUrl).map(r => ({ id: r.id, userId: r.userId, name: r.name, type: "USDT Buy Proof", url: r.screenshotUrl!, createdAt: r.createdAt })),
    ...usdtSell.filter(r => r.screenshotUrl).map(r => ({ id: r.id, userId: r.userId, name: r.name, type: "USDT Sell Proof", url: r.screenshotUrl!, createdAt: r.createdAt })),
  ]

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // ── Sub-components ───────────────────────────────────────────────────────────

  const ScreenshotModal = () => {
    if (!screenshotModal) return null
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setScreenshotModal(null)}>
        <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
          <button onClick={() => setScreenshotModal(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center z-10 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <img src={screenshotModal} alt="Payment screenshot" className="w-full rounded-xl border border-border shadow-2xl" />
        </div>
      </div>
    )
  }

  const ScreenshotCell = ({ url }: { url?: string }) => {
    if (!url) return <span className="text-xs text-muted-foreground">Not uploaded</span>
    return (
      <button onClick={() => setScreenshotModal(url)} className="flex items-center gap-1.5 text-primary hover:underline text-xs" title="View">
        <img src={url} alt="proof" className="w-8 h-8 rounded object-cover border border-border" />
        <ExternalLink className="w-3 h-3" />
      </button>
    )
  }

  const DetailModal = () => {
    if (!detailView) return null
    const history = submissions.filter(s => s.userId === detailView.userId)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-foreground">Member Profile</h3>
            <button onClick={() => setDetailView(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["User ID", detailView.userId || "—"],
              ["Name", detailView.name],
              ["Email", detailView.email || "—"],
              ["Phone", detailView.phone || "—"],
              ["Telegram", detailView.telegram || "—"],
              ["Type", detailView.type.replace(/_/g, " ")],
              ["Payment", detailView.paymentMethod || "—"],
              ["Amount", detailView.amount || "—"],
              ["UTR / TXID", detailView.utr || "—"],
              ["Status", detailView.status],
              ["Location", detailView.location],
              ["IP Address", detailView.ipAddress],
              ["Joined", fmtDate(detailView.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground w-24 shrink-0 text-xs">{k}</span>
                <span className="text-foreground font-medium break-all text-xs">{v}</span>
              </div>
            ))}
            {detailView.screenshotUrl ? (
              <div className="p-2.5 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                <button onClick={() => setScreenshotModal(detailView.screenshotUrl!)} className="block w-full rounded-lg border border-border overflow-hidden">
                  <img src={detailView.screenshotUrl} alt="Payment proof" className="w-full max-h-40 object-cover hover:opacity-80 transition-opacity" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                <ImageIcon className="w-4 h-4" /> No screenshot uploaded
              </div>
            )}
            {history.length > 1 && (
              <div className="p-2.5 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-2">Payment History ({history.length} records)</p>
                <div className="space-y-1">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{h.type.replace(/_/g, " ")} — {h.amount || "—"}</span>
                      <span className={`px-1.5 py-0.5 rounded border text-xs ${statusBadge(h.status)}`}>{h.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border">
            {detailView.status === "pending" && (
              <>
                <Button size="sm" className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 text-xs" onClick={() => updateStatus(detailView.id, "approved")}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs" onClick={() => { updateStatus(detailView.id, "rejected"); setDetailView(null) }}>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDetailView(null)} className="ml-auto text-muted-foreground text-xs">Close</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  const nonGroupNav = NAV.filter(n => !n.group)
  const usdtNav     = NAV.filter(n => n.group === "USDT Trading")

  const SidebarContent = () => (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm leading-tight">Admin Panel</p>
          <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {["dashboard", "payment-verification"].map(key => {
          const item = NAV.find(n => n.key === key)!
          return (
            <button key={key} onClick={() => { setActiveSection(key as Section); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {activeSection === key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          )
        })}

        <div>
          <button onClick={() => setUsdtOpen(!usdtOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${usdtNav.some(n => n.key === activeSection) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
            <DollarSign className="w-4 h-4 shrink-0" />
            USDT Trading
            {usdtOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>
          {usdtOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
              {usdtNav.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {["suspicious", "members", "notifications"].map(key => {
          const item = NAV.find(n => n.key === key)!
          return (
            <button key={key} onClick={() => { setActiveSection(key as Section); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {key === "suspicious" && suspiciousSubs.length > 0 && (
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">{suspiciousSubs.length}</span>
              )}
              {key === "notifications" && unreadCount > 0 && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
              )}
              {activeSection === key && !["suspicious","notifications"].some(k => k === key && (suspiciousSubs.length > 0 || unreadCount > 0)) && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          )
        })}

        <div className="pt-1 border-t border-border" />

        {["files", "export", "system-control", "security", "logs"].map(key => {
          const item = NAV.find(n => n.key === key)!
          return (
            <button key={key} onClick={() => { setActiveSection(key as Section); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {activeSection === key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border shrink-0">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )

  // ── Section renderers ─────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "VIP Members",       value: vipSubs.length,     icon: Star,          color: "text-primary"   },
          { label: "Mentorship",        value: mentorSubs.length,  icon: FileText,      color: "text-blue-400"  },
          { label: "USDT Buy Orders",   value: usdtBuy.length,     icon: ArrowDownLeft, color: "text-green-400" },
          { label: "USDT Sell Orders",  value: usdtSell.length,    icon: ArrowUpRight,  color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: submissions.length,       icon: Hash,          color: "text-foreground" },
          { label: "Pending",           value: pendingSubs.length,       icon: Clock,         color: "text-amber-400"  },
          { label: "Approved",          value: submissions.filter(s => s.status === "approved" || s.status === "completed").length, icon: CheckCircle, color: "text-green-400" },
          { label: "Suspicious",        value: suspiciousSubs.length,    icon: AlertTriangle, color: "text-red-400"    },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`p-4 rounded-xl bg-card border ${label === "Suspicious" && suspiciousSubs.length > 0 ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" /><h3 className="font-semibold text-foreground">Recent VIP / VIP Group</h3></div>
          <button onClick={() => setActiveSection("payment-verification")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {vipSubs.slice(0, 4).map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Star className="w-4 h-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.telegram || s.email || "—"} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className="text-xs font-medium text-foreground">{s.amount || "—"}</span>
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
          ))}
          {vipSubs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No VIP members yet</p>}
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /><h3 className="font-semibold text-foreground">Recent Mentorship</h3></div>
        </div>
        <div className="divide-y divide-border">
          {mentorSubs.slice(0, 4).map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-400" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.telegram || "—"} · {s.paymentMethod} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className="text-xs font-medium text-foreground">{s.amount || "—"}</span>
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
          ))}
          {mentorSubs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No mentorship members yet</p>}
        </div>
      </div>
    </div>
  )

  const renderPaymentVerification = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Payment Verification</h2>
        <button onClick={loadData} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID","Name","Telegram","Payment Method","Amount Paid","UTR / TXID","Screenshot","Date","Status","Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0
                ? <tr><td colSpan={10} className="py-12 text-center text-muted-foreground text-sm">No submissions yet</td></tr>
                : submissions.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{s.userId || uid(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                      <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                    <td className="py-3 px-4 text-xs text-foreground whitespace-nowrap">{s.paymentMethod || "—"}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground whitespace-nowrap">{s.amount || "—"}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-[110px] truncate">{s.utr || "—"}</td>
                    <td className="py-3 px-4"><ScreenshotCell url={s.screenshotUrl} /></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></button>
                        {s.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => updateStatus(s.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Reject"><Ban className="w-4 h-4" /></button>
                          </>
                        )}
                        <button onClick={() => deleteSubmission(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUSDTBuy = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ArrowDownLeft className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bold text-foreground">USDT Buy Requests</h2>
        <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-semibold">{usdtBuy.length}</span>
      </div>
      <p className="text-sm text-muted-foreground">Users buying USDT from you — verify payment then send USDT to their wallet.</p>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID","Name","Email","Phone","Wallet Address","TX ID","Screenshot","USDT Amount","INR Equiv.","Amount Paid","Submitted","Status","Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usdtBuy.length === 0
                ? <tr><td colSpan={13} className="py-12 text-center text-muted-foreground text-sm">No USDT buy requests yet</td></tr>
                : usdtBuy.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{r.userId}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground whitespace-nowrap">{r.name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{r.email}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{r.phone}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={r.walletAddress}>{r.walletAddress}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-[100px] truncate" title={r.txId}>{r.txId || "—"}</td>
                    <td className="py-3 px-4"><ScreenshotCell url={r.screenshotUrl} /></td>
                    <td className="py-3 px-4 text-xs font-medium text-green-400 whitespace-nowrap">{r.amountUsdt} USDT</td>
                    <td className="py-3 px-4 text-xs text-foreground whitespace-nowrap">{r.inrEquivalent}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground whitespace-nowrap">{r.amountPaid}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateBuyStatus(r.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => updateBuyStatus(r.id, "pending")} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10" title="Mark Pending"><Clock className="w-4 h-4" /></button>
                        <button onClick={() => updateBuyStatus(r.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Reject"><Ban className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUSDTSell = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ArrowUpRight className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-bold text-foreground">USDT Sell Requests</h2>
        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-semibold">{usdtSell.length}</span>
      </div>
      <p className="text-sm text-muted-foreground">Users selling USDT to you — verify their USDT transfer then send INR to their UPI.</p>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID","Name","Email","Phone","UPI ID","Wallet Address","USDT Sent","TX ID","Screenshot","Submitted","Status","Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usdtSell.length === 0
                ? <tr><td colSpan={12} className="py-12 text-center text-muted-foreground text-sm">No USDT sell requests yet</td></tr>
                : usdtSell.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{r.userId}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground whitespace-nowrap">{r.name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{r.email}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{r.phone}</td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground">{r.upiId}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-[100px] truncate" title={r.walletAddress}>{r.walletAddress}</td>
                    <td className="py-3 px-4 text-xs font-medium text-amber-400 whitespace-nowrap">{r.usdtAmount} USDT</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-[100px] truncate" title={r.txId}>{r.txId || "—"}</td>
                    <td className="py-3 px-4"><ScreenshotCell url={r.screenshotUrl} /></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateSellStatus(r.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve — Send INR"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => updateSellStatus(r.id, "pending")} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10" title="Mark Pending"><Clock className="w-4 h-4" /></button>
                        <button onClick={() => updateSellStatus(r.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Reject"><Ban className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSuspicious = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h2 className="text-xl font-bold text-foreground">Fraud Detection</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Duplicate UTR / TXID", value: suspiciousSubs.length, color: "text-red-400" },
          { label: "Total Submissions",    value: submissions.length,     color: "text-foreground" },
          { label: "Under Review",         value: pendingSubs.length,     color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      {suspiciousSubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
          <p className="font-semibold text-foreground mb-1">No suspicious activity detected</p>
          <p className="text-sm text-muted-foreground">Duplicate UTR / TXID submissions are flagged here automatically.</p>
        </div>
      ) : (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{suspiciousSubs.length} submission{suspiciousSubs.length > 1 ? "s" : ""} flagged — duplicate UTR / TXID detected. Manual review required.</p>
          </div>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    {["User ID","Name","UTR / TXID","Fraud Reason","Payment Method","Amount","Submitted","Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suspiciousSubs.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/50 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.userId || uid(i)}</td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-red-400 font-semibold">{s.utr || "—"}</td>
                      <td className="py-3 px-4 text-xs text-red-300">Duplicate UTR / TXID</td>
                      <td className="py-3 px-4 text-xs text-foreground">{s.paymentMethod || "—"}</td>
                      <td className="py-3 px-4 text-xs font-medium text-foreground">{s.amount || "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve Anyway"><UserCheck className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(s.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Reject"><UserX className="w-4 h-4" /></button>
                          <button onClick={() => deleteSubmission(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Block / Delete"><Ban className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderMembers = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Member Database</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
          placeholder="Search by name, email, phone, Telegram, or User ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        {memberSearch && <button onClick={() => setMemberSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID","Name","Email","Phone","Telegram","Type","Join Date","Membership","Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0
                ? <tr><td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">{memberSearch ? "No members match your search" : "No members yet"}</td></tr>
                : filteredMembers.map((u, i) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-primary">{u.userId || uid(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <button onClick={() => setDetailView(u)} className="hover:text-primary hover:underline">{u.name}</button>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{u.email || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{u.phone || "—"}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{u.telegram || "—"}</td>
                    <td className="py-3 px-4 text-xs text-foreground capitalize">{u.type.replace(/_/g, " ")}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(u.status)}`}>{u.status}</span></td>
                    <td className="py-3 px-4"><button onClick={() => setDetailView(u)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="Full Profile"><Eye className="w-4 h-4" /></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => {
    const notifIcon = (type: AdminNotification["type"]) => {
      if (type === "vip") return <Star className="w-4 h-4 text-primary" />
      if (type === "mentorship") return <FileText className="w-4 h-4 text-blue-400" />
      if (type === "usdt") return <DollarSign className="w-4 h-4 text-green-400" />
      return <AlertTriangle className="w-4 h-4 text-red-400" />
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            {unreadCount > 0 && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setNotifEnabled(!notifEnabled)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${notifEnabled ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>
              {notifEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {notifEnabled ? "Enabled" : "Disabled"}
            </button>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
          {notifications.length === 0
            ? <div className="py-16 text-center text-muted-foreground text-sm">No notifications yet</div>
            : notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">{notifIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            ))
          }
        </div>
      </div>
    )
  }

  const renderFiles = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">File Manager</h2>
      <p className="text-sm text-muted-foreground">All uploaded files associated with user submissions.</p>
      {allFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border text-center">
          <Folder className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground mb-1">No files uploaded yet</p>
          <p className="text-sm text-muted-foreground">Payment screenshots and verification files will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allFiles.map(f => (
            <div key={f.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="h-40 bg-secondary/50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative" onClick={() => setScreenshotModal(f.url)}>
                <img src={f.url} alt={f.type} className="h-full w-full object-cover absolute inset-0" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.type} · {f.userId}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(f.createdAt)}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => setScreenshotModal(f.url)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Eye className="w-3 h-3" /> View</button>
                  <a href={f.url} download className="flex items-center gap-1 text-xs text-primary hover:underline"><Download className="w-3 h-3" /> Download</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderExport = () => {
    const exports = [
      { label: "Members Database", desc: "All registered members with contact info and membership status", count: userList.length, action: () => downloadCSV(userList.map(u => ({ userId: u.userId, name: u.name, email: u.email || "", phone: u.phone || "", telegram: u.telegram || "", type: u.type, status: u.status, joined: u.createdAt })), "members.csv") },
      { label: "Payment Records", desc: "All payment submissions including status, amounts, and UTR numbers", count: submissions.length, action: () => downloadCSV(submissions.map(s => ({ id: s.id, userId: s.userId, name: s.name, method: s.paymentMethod, amount: s.amount, utr: s.utr, status: s.status, date: s.createdAt })), "payments.csv") },
      { label: "USDT Buy Requests", desc: "All USDT buy requests with wallet addresses and transaction IDs", count: usdtBuy.length, action: () => downloadCSV(usdtBuy.map(r => ({ id: r.id, userId: r.userId, name: r.name, wallet: r.walletAddress, txId: r.txId, amountUsdt: r.amountUsdt, inr: r.inrEquivalent, status: r.status, date: r.createdAt })), "usdt-buy.csv") },
      { label: "USDT Sell Requests", desc: "All USDT sell requests with UPI IDs for INR payouts", count: usdtSell.length, action: () => downloadCSV(usdtSell.map(r => ({ id: r.id, userId: r.userId, name: r.name, upi: r.upiId, wallet: r.walletAddress, usdt: r.usdtAmount, txId: r.txId, status: r.status, date: r.createdAt })), "usdt-sell.csv") },
    ]
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Export Data</h2>
        <p className="text-sm text-muted-foreground">Download your data as CSV files. Excel-compatible format.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exports.map(({ label, desc, count, action }) => (
            <div key={label} className="p-5 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-mono shrink-0 ml-3">{count} rows</span>
              </div>
              <Button size="sm" onClick={action} disabled={count === 0} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download CSV
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSystemControl = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">System Control</h2>
      {systemSettings.maintenanceMode && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400 font-medium">Maintenance mode is ACTIVE — the site is currently hidden from users.</p>
        </div>
      )}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Payment Methods</h3>
        {[
          { key: "upiEnabled" as const, label: "UPI Payments" },
          { key: "cryptoEnabled" as const, label: "Crypto / USDT Payments" },
          { key: "erupeeEnabled" as const, label: "E-Rupee (Digital Rupee)" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{label}</span>
            <button onClick={() => saveSystem({ [key]: !systemSettings[key] })} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${systemSettings[key] ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
              {systemSettings[key] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {systemSettings[key] ? "Enabled" : "Disabled"}
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Pricing</h3>
        {[
          { key: "vipPrice" as const, label: "VIP Signals Price" },
          { key: "mentorshipPrice" as const, label: "Mentorship Price" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <label className="text-sm text-foreground w-40 shrink-0">{label}</label>
            <input value={systemSettings[key]} onChange={e => setSystemSettings(s => ({ ...s, [key]: e.target.value }))} onBlur={() => saveSystem({})}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Payment Instructions</h3>
        <textarea value={systemSettings.paymentInstructions} onChange={e => setSystemSettings(s => ({ ...s, paymentInstructions: e.target.value }))} onBlur={() => saveSystem({})}
          rows={3} className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" />
      </div>
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Maintenance Mode</h3>
            <p className="text-xs text-muted-foreground mt-0.5">When enabled, users will see a maintenance message instead of the site.</p>
          </div>
          <button onClick={() => saveSystem({ maintenanceMode: !systemSettings.maintenanceMode })} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${systemSettings.maintenanceMode ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
            {systemSettings.maintenanceMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {systemSettings.maintenanceMode ? "Active" : "Inactive"}
          </button>
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => {
    const handleSecSave = async () => {
      if (secForm.newPw && secForm.newPw !== secForm.confirmPw) {
        setSecMsg({ type: "err", text: "New passwords do not match." }); return
      }
      if (secForm.newPw) {
        const result = await changePassword(secForm.oldPw, secForm.newPw)
        if (!result.success) { setSecMsg({ type: "err", text: result.error ?? "Current password incorrect." }); return }
      }
      setSecMsg({ type: "ok", text: "Settings saved successfully." })
      setTimeout(() => setSecMsg(null), 3000)
    }
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Security Settings</h2>
        {secMsg && (
          <div className={`p-3 rounded-lg border text-sm ${secMsg.type === "ok" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>{secMsg.text}</div>
        )}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Account Details</h3>
          {[
            { key: "name" as const,  label: "Admin Name",  icon: Users },
            { key: "email" as const, label: "Email",        icon: Mail  },
            { key: "phone" as const, label: "Phone Number", icon: Phone },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-muted-foreground w-28 shrink-0">{label}</label>
              <input value={secForm[key]} onChange={e => setSecForm(f => ({ ...f, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Change Password</h3>
          {[
            { key: "oldPw" as const,     label: "Current Password" },
            { key: "newPw" as const,     label: "New Password"     },
            { key: "confirmPw" as const, label: "Confirm Password" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-muted-foreground w-28 shrink-0">{label}</label>
              <input type="password" value={secForm[key]} onChange={e => setSecForm(f => ({ ...f, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          ))}
        </div>
        <Button onClick={handleSecSave} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Save Changes</Button>
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">IP Login History</h3>
          </div>
          <div className="divide-y divide-border">
            {securityLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.email} · {log.ipAddress || "—"}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${log.success ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                    {log.success ? "Success" : "Failed"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(log.timestamp)}</p>
                </div>
              </div>
            ))}
            {securityLogs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No login history yet</p>}
          </div>
        </div>
      </div>
    )
  }

  const renderLogs = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Admin Logs</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["Action","Email","IP Address","Result","Time"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {securityLogs.length === 0
                ? <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No logs found</td></tr>
                : securityLogs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 text-sm text-foreground">{log.action}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.email}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${log.success ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {log.success ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(log.timestamp)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":            return renderDashboard()
      case "payment-verification": return renderPaymentVerification()
      case "usdt-buy":             return renderUSDTBuy()
      case "usdt-sell":            return renderUSDTSell()
      case "suspicious":           return renderSuspicious()
      case "members":              return renderMembers()
      case "notifications":        return renderNotifications()
      case "files":                return renderFiles()
      case "export":               return renderExport()
      case "system-control":       return renderSystemControl()
      case "security":             return renderSecurity()
      case "logs":                 return renderLogs()
      default:                     return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">{NAV.find(n => n.key === activeSection)?.label || "Admin Panel"}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">OG KAAL TRADER — Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveSection("notifications")} className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Notifications">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>

      <ScreenshotModal />
      <DetailModal />
    </div>
  )
}
