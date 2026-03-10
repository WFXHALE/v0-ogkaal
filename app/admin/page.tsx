"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, LogOut, RefreshCw, Trash2, CheckCircle, Clock,
  Users, FileText, CreditCard, Star, BarChart2, Settings,
  Activity, Menu, X, ChevronRight, DollarSign, TrendingUp,
  Eye, Edit, Ban, Image, ExternalLink, AlertCircle, Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { isSessionValid, logout, getSession, getSecurityLogs } from "@/lib/admin-auth"
import type { SecurityLog } from "@/lib/admin-auth"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard"
  | "payments"
  | "payment-verification"
  | "users"
  | "vip-access"
  | "revenue"
  | "settings"
  | "logs"

interface Submission {
  id: string
  userId?: string
  type: "usdt_p2p" | "funded_account" | "mentorship" | "vip" | "other"
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
  ipAddress: string
  location: string
  createdAt: string
}

// ─── Sidebar nav config ────────────────────────────────────────────────────────

const NAV: { key: Section; label: string; icon: typeof Shield }[] = [
  { key: "dashboard",            label: "Dashboard",              icon: BarChart2 },
  { key: "payments",             label: "Payments",               icon: CreditCard },
  { key: "payment-verification", label: "Payment Verification",   icon: CheckCircle },
  { key: "users",                label: "Users / Members",        icon: Users },
  { key: "vip-access",           label: "VIP Access Management",  icon: Star },
  { key: "revenue",              label: "Revenue Analytics",      icon: TrendingUp },
  { key: "settings",             label: "Settings",               icon: Settings },
  { key: "logs",                 label: "Admin Logs",             icon: Activity },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function generateUserId(index: number) {
  return `USER-${String(index + 1).padStart(4, "0")}`
}

function statusBadge(status: Submission["status"]) {
  const map = {
    pending:   "bg-amber-500/10 text-amber-400 border-amber-500/30",
    approved:  "bg-green-500/10 text-green-400 border-green-500/30",
    rejected:  "bg-red-500/10 text-red-400 border-red-500/30",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  }
  return map[status]
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO: Submission[] = [
  {
    id: "1", userId: "USER-0001", type: "mentorship", name: "Rahul Kumar",
    email: "rahul@example.com", telegram: "@rahulk", phone: "+91 76543 21098",
    details: { program: "Mentorship 2.0", experience: "Beginner" },
    status: "pending", paymentMethod: "UPI", amount: "₹4,999", utr: "UTR123456789",
    ipAddress: "49.207.89.123", location: "Bangalore, India",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2", userId: "USER-0002", type: "vip", name: "Jane Smith",
    email: "jane@example.com", telegram: "@janesmith", phone: "+91 87654 32109",
    details: { plan: "VIP Group", duration: "Monthly" },
    status: "pending", paymentMethod: "USDT TRC20", amount: "$29",
    utr: "abc123txid", screenshotUrl: "",
    ipAddress: "182.73.45.12", location: "Delhi, India",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3", userId: "USER-0003", type: "usdt_p2p", name: "John Doe",
    telegram: "@johndoe", phone: "+91 98765 43210",
    details: { action: "buy", amount: "500 USDT", paymentMethod: "UPI" },
    status: "completed", paymentMethod: "UPI", amount: "₹41,000",
    ipAddress: "103.45.67.89", location: "Mumbai, India",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail]           = useState("")
  const [isLoading, setIsLoading]             = useState(true)
  const [activeSection, setActiveSection]     = useState<Section>("dashboard")
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [mounted, setMounted]                 = useState(false)
  const [submissions, setSubmissions]         = useState<Submission[]>([])
  const [securityLogs, setSecurityLogs]       = useState<SecurityLog[]>([])
  const [detailView, setDetailView]           = useState<Submission | null>(null)

  // Settings state
  const [settingsEmail, setSettingsEmail]     = useState("")
  const [settingsSaved, setSettingsSaved]     = useState(false)

  const loadData = useCallback(() => {
    const stored = localStorage.getItem("og_admin_submissions")
    if (stored) {
      setSubmissions(JSON.parse(stored))
    } else {
      setSubmissions(DEMO)
      localStorage.setItem("og_admin_submissions", JSON.stringify(DEMO))
    }
    setSecurityLogs(getSecurityLogs())
  }, [])

  useEffect(() => {
    setMounted(true)
    if (!isSessionValid()) { router.push("/admin/login"); return }
    const session = getSession()
    if (session) { setAdminEmail(session.email); setSettingsEmail(session.email) }
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
  }

  const deleteSubmission = (id: string) => {
    if (!confirm("Delete this submission?")) return
    saveSubmissions(submissions.filter(s => s.id !== id))
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  const formatDate = (d: string) => {
    if (!mounted) return ""
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  // Derived stats
  const stats = {
    total:     submissions.length,
    pending:   submissions.filter(s => s.status === "pending").length,
    approved:  submissions.filter(s => s.status === "approved").length,
    vip:       submissions.filter(s => s.type === "vip").length,
    mentorship:submissions.filter(s => s.type === "mentorship").length,
    revenue:   submissions.filter(s => s.status === "approved" || s.status === "completed").length * 4999,
  }

  const vipSubmissions  = submissions.filter(s => s.type === "vip")
  const paymentSubs     = submissions.filter(s => s.type !== "vip")
  const pendingSubs     = submissions.filter(s => s.status === "pending")
  const userList        = submissions.reduce<Submission[]>((acc, s) => {
    if (!acc.find(a => a.userId === s.userId)) acc.push(s)
    return acc
  }, [])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm leading-tight">Admin Panel</p>
          <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveSection(key); setSidebarOpen(false); setDetailView(null) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              activeSection === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {activeSection === key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )

  // ── Submission detail modal ────────────────────────────────────────────────
  const DetailModal = () => {
    if (!detailView) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-foreground">Submission Details</h3>
            <button onClick={() => setDetailView(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ["User ID",    detailView.userId || "—"],
              ["Name",       detailView.name],
              ["Email",      detailView.email || "—"],
              ["Phone",      detailView.phone || "—"],
              ["Telegram",   detailView.telegram || "—"],
              ["Type",       detailView.type],
              ["Payment",    detailView.paymentMethod || "—"],
              ["Amount",     detailView.amount || "—"],
              ["UTR / TXID", detailView.utr || "—"],
              ["Status",     detailView.status],
              ["Location",   detailView.location],
              ["IP",         detailView.ipAddress],
              ["Submitted",  formatDate(detailView.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground w-24 shrink-0">{k}</span>
                <span className="text-foreground font-medium break-all">{v}</span>
              </div>
            ))}
            {detailView.screenshotUrl && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-muted-foreground mb-2">Screenshot</p>
                <a href={detailView.screenshotUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
                  <ExternalLink className="w-4 h-4" /> View Screenshot
                </a>
              </div>
            )}
            {Object.keys(detailView.details).length > 0 && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-muted-foreground mb-2">Additional Details</p>
                {Object.entries(detailView.details).map(([k, v]) => (
                  <p key={k} className="text-foreground text-xs"><span className="capitalize text-muted-foreground">{k}:</span> {String(v)}</p>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            {detailView.status === "pending" && (
              <>
                <Button size="sm" className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30" onClick={() => { updateStatus(detailView.id, "approved"); setDetailView(null) }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button size="sm" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30" onClick={() => { updateStatus(detailView.id, "rejected"); setDetailView(null) }}>
                  <Ban className="w-4 h-4 mr-1" /> Reject
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDetailView(null)} className="ml-auto text-muted-foreground">
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Section renderers ──────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total",       value: stats.total,     icon: FileText,  color: "text-foreground" },
          { label: "Pending",     value: stats.pending,   icon: Clock,     color: "text-amber-400"  },
          { label: "Approved",    value: stats.approved,  icon: CheckCircle, color: "text-green-400"},
          { label: "VIP Sales",   value: stats.vip,       icon: Star,      color: "text-primary"    },
          { label: "Mentorship",  value: stats.mentorship,icon: Users,     color: "text-blue-400"   },
          { label: "Est. Revenue",value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent submissions */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Submissions</h3>
          <button onClick={() => setActiveSection("payments")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {submissions.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.type} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTable = (rows: Submission[], title: string, showScreenshot = false) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <button onClick={loadData} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID", "Name", "Contact", "Type / Method", "Amount", "UTR / TXID", showScreenshot ? "Screenshot" : "Location", "Submitted", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">No records found</td></tr>
              ) : rows.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{s.userId || generateUserId(i)}</td>
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{s.name}</td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {s.telegram && <p className="text-xs text-foreground">{s.telegram}</p>}
                      {s.phone    && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                      {s.email    && <p className="text-xs text-muted-foreground">{s.email}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="block text-xs text-foreground capitalize">{s.type.replace("_", " ")}</span>
                    {s.paymentMethod && <span className="text-xs text-muted-foreground">{s.paymentMethod}</span>}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{s.amount || "—"}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap max-w-[120px] truncate">{s.utr || "—"}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {showScreenshot
                      ? s.screenshotUrl
                        ? <a href={s.screenshotUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Image className="w-3 h-3" /> View</a>
                        : <span className="text-muted-foreground">Not uploaded</span>
                      : s.location
                    }
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${statusBadge(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {s.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateStatus(s.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Reject">
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={() => deleteSubmission(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Users / Members</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID", "Name", "Email", "Phone", "Telegram", "Submissions", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No users found</td></tr>
              ) : userList.map((u, i) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-primary">{u.userId || generateUserId(i)}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{u.name}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{u.email || "—"}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{u.phone || "—"}</td>
                  <td className="py-3 px-4 text-xs text-foreground">{u.telegram || "—"}</td>
                  <td className="py-3 px-4 text-xs text-foreground">{submissions.filter(s => s.userId === u.userId || s.name === u.name).length}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setDetailView(u)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Disable"><Ban className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderRevenue = () => {
    const approved = submissions.filter(s => s.status === "approved" || s.status === "completed")
    const upiCount  = approved.filter(s => s.paymentMethod?.toLowerCase().includes("upi")).length
    const cryptoCount = approved.length - upiCount
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Revenue Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue",    value: `₹${(approved.length * 4999).toLocaleString("en-IN")}`, icon: DollarSign, color: "text-green-400" },
            { label: "Approved Payments",value: approved.length,    icon: CheckCircle, color: "text-green-400" },
            { label: "VIP Sales",        value: vipSubmissions.filter(s => s.status === "approved").length, icon: Star, color: "text-primary" },
            { label: "Mentorship Sales", value: submissions.filter(s => s.type === "mentorship" && s.status === "approved").length, icon: Users, color: "text-blue-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-5 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Payment Method Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">UPI</span>
                  <span className="text-foreground font-medium">{upiCount}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${approved.length ? (upiCount / approved.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Crypto / USDT</span>
                  <span className="text-foreground font-medium">{cryptoCount}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${approved.length ? (cryptoCount / approved.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Product Breakdown</h3>
            <div className="space-y-2">
              {["mentorship", "vip", "usdt_p2p", "funded_account"].map(type => {
                const count = submissions.filter(s => s.type === type && (s.status === "approved" || s.status === "completed")).length
                const label = type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{label}</span>
                    <span className="font-medium text-foreground">{count} sales</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-foreground">Settings</h2>
      <div className="p-5 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-semibold text-foreground">Admin Account</h3>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
          <input
            type="email"
            value={settingsEmail}
            onChange={e => setSettingsEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Button
          onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000) }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {settingsSaved ? <><CheckCircle className="w-4 h-4 mr-1.5" /> Saved</> : "Save Changes"}
        </Button>
      </div>
      <div className="p-5 rounded-xl bg-card border border-border space-y-3">
        <h3 className="font-semibold text-foreground">Data Management</h3>
        <p className="text-sm text-muted-foreground">All submission data is stored locally. Export or clear as needed.</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const data = JSON.stringify(submissions, null, 2)
              const blob = new Blob([data], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a"); a.href = url; a.download = "og-admin-data.json"; a.click()
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => { if (confirm("Clear all submissions? This cannot be undone.")) { saveSubmissions([]) } }}
          >
            Clear All Data
          </Button>
        </div>
      </div>
    </div>
  )

  const renderLogs = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Admin Logs</h2>
      {securityLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No security logs yet.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Event", "Email", "IP Address", "Location", "Time"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {securityLogs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        log.type === "login_success" || log.type === "2fa_verified"
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : log.type === "login_failed"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}>
                        {log.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.email || "—"}</td>
                    <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.location}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":            return renderDashboard()
      case "payments":             return renderTable(paymentSubs,  "All Payments")
      case "payment-verification": return renderTable(pendingSubs,   "Payment Verification — Pending Review")
      case "users":                return renderUsers()
      case "vip-access":           return renderTable(vipSubmissions,"VIP Access Management", true)
      case "revenue":              return renderRevenue()
      case "settings":             return renderSettings()
      case "logs":                 return renderLogs()
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-foreground text-sm sm:text-base">
              {NAV.find(n => n.key === activeSection)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {renderSection()}
        </main>
      </div>

      <DetailModal />
    </div>
  )
}
