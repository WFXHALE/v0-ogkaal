"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, LogOut, RefreshCw, Trash2, CheckCircle, Clock,
  Users, FileText, CreditCard, Star, BarChart2, Settings,
  Activity, Menu, X, ChevronRight, DollarSign, TrendingUp,
  Eye, Edit, Ban, ExternalLink, AlertCircle, Hash,
  AlertTriangle, UserCheck, UserX, ChevronDown, ChevronUp,
  Download, Image as ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { isSessionValid, logout, getSession, getSecurityLogs } from "@/lib/admin-auth"
import type { SecurityLog } from "@/lib/admin-auth"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard"
  | "payments"
  | "payment-verification"
  | "suspicious"
  | "users"
  | "vip-access"
  | "revenue"
  | "members-vip"
  | "members-mentorship"
  | "members-vipgroup"
  | "settings"
  | "logs"

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
  ipAddress: string
  location: string
  createdAt: string
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const NAV: { key: Section; label: string; icon: typeof Shield; group?: string }[] = [
  { key: "dashboard",            label: "Dashboard",             icon: BarChart2 },
  { key: "payments",             label: "Payments",              icon: CreditCard },
  { key: "payment-verification", label: "Payment Verification",  icon: CheckCircle },
  { key: "suspicious",           label: "Suspicious Payments",   icon: AlertTriangle },
  { key: "users",                label: "Users / Members",       icon: Users },
  { key: "vip-access",           label: "VIP Access Management", icon: Star },
  { key: "revenue",              label: "Revenue Analytics",     icon: TrendingUp },
  { key: "members-vip",          label: "VIP Members",           icon: UserCheck,  group: "Members" },
  { key: "members-mentorship",   label: "Mentorship Members",    icon: FileText,   group: "Members" },
  { key: "members-vipgroup",     label: "VIP Group Members",     icon: Users,      group: "Members" },
  { key: "settings",             label: "Settings",              icon: Settings },
  { key: "logs",                 label: "Admin Logs",            icon: Activity },
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
  return {
    pending:   "bg-amber-500/10 text-amber-400 border-amber-500/30",
    approved:  "bg-green-500/10 text-green-400 border-green-500/30",
    rejected:  "bg-red-500/10 text-red-400 border-red-500/30",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  }[status]
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO: Submission[] = [
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
    utr: "abc123txid", screenshotUrl: "",
    ipAddress: "182.73.45.12", location: "Delhi, India",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3", userId: "USER-0001", type: "usdt_p2p", name: "Rahul Kumar",
    telegram: "@rahulk", phone: "+91 98765 43210",
    details: { action: "buy", amount: "500 USDT" },
    status: "completed", paymentMethod: "UPI", amount: "₹41,000",
    utr: "UTR123456789",  // duplicate UTR — triggers suspicious
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated]   = useState(false)
  const [adminEmail, setAdminEmail]             = useState("")
  const [isLoading, setIsLoading]               = useState(true)
  const [activeSection, setActiveSection]       = useState<Section>("dashboard")
  const [sidebarOpen, setSidebarOpen]           = useState(false)
  const [membersOpen, setMembersOpen]           = useState(false)
  const [mounted, setMounted]                   = useState(false)
  const [submissions, setSubmissions]           = useState<Submission[]>([])
  const [securityLogs, setSecurityLogs]         = useState<SecurityLog[]>([])
  const [detailView, setDetailView]             = useState<Submission | null>(null)
  const [screenshotModal, setScreenshotModal]   = useState<string | null>(null)
  const [settingsEmail, setSettingsEmail]       = useState("")
  const [settingsSaved, setSettingsSaved]       = useState(false)

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
    if (detailView?.id === id) setDetailView(prev => prev ? { ...prev, status } : null)
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
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const vipSubs         = submissions.filter(s => s.type === "vip")
  const vipGroupSubs    = submissions.filter(s => s.type === "vip_group")
  const mentorshipSubs  = submissions.filter(s => s.type === "mentorship")
  const usdtSubs        = submissions.filter(s => s.paymentMethod?.toLowerCase().includes("usdt") || s.paymentMethod?.toLowerCase().includes("crypto") || s.paymentMethod?.toLowerCase().includes("trc") || s.paymentMethod?.toLowerCase().includes("bep"))
  const pendingSubs     = submissions.filter(s => s.status === "pending")
  const approvedSubs    = submissions.filter(s => s.status === "approved" || s.status === "completed")

  // Suspicious: duplicated UTR/TXID across different submissions
  const utrCounts: Record<string, string[]> = {}
  submissions.forEach(s => {
    if (s.utr) {
      if (!utrCounts[s.utr]) utrCounts[s.utr] = []
      utrCounts[s.utr].push(s.id)
    }
  })
  const suspiciousSubs = submissions.filter(s => s.utr && utrCounts[s.utr]?.length > 1)

  const userList = submissions.reduce<Submission[]>((acc, s) => {
    if (!acc.find(a => a.userId === s.userId && a.name === s.name)) acc.push(s)
    return acc
  }, [])

  const stats = {
    total:      submissions.length,
    pending:    pendingSubs.length,
    approved:   approvedSubs.length,
    vip:        vipSubs.length,
    mentorship: mentorshipSubs.length,
    vipGroup:   vipGroupSubs.length,
    suspicious: suspiciousSubs.length,
    revenue:    approvedSubs.length * 4999,
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────

  const nonGroupNav = NAV.filter(n => !n.group)
  const membersNav  = NAV.filter(n => n.group === "Members")

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
        {nonGroupNav.map(({ key, label, icon: Icon }) => (
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
            {key === "suspicious" && stats.suspicious > 0 && (
              <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                {stats.suspicious}
              </span>
            )}
            {activeSection === key && stats.suspicious === 0 && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </button>
        ))}

        {/* Members accordion */}
        <div>
          <button
            onClick={() => setMembersOpen(!membersOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              membersNav.some(n => n.key === activeSection)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Members
            {membersOpen
              ? <ChevronUp className="w-3.5 h-3.5 ml-auto" />
              : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>
          {membersOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
              {membersNav.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setActiveSection(key); setSidebarOpen(false); setDetailView(null) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeSection === key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings + Logs after Members */}
        {NAV.filter(n => n.key === "settings" || n.key === "logs").map(({ key, label, icon: Icon }) => (
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

      <div className="px-3 py-4 border-t border-border shrink-0">
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

  // ── Screenshot modal ────────────────────────────────────────────────────────

  const ScreenshotModal = () => {
    if (!screenshotModal) return null
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={() => setScreenshotModal(null)}
      >
        <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setScreenshotModal(null)}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={screenshotModal}
            alt="Payment screenshot"
            className="w-full rounded-xl border border-border shadow-2xl"
          />
        </div>
      </div>
    )
  }

  // ── Detail modal ────────────────────────────────────────────────────────────

  const DetailModal = () => {
    if (!detailView) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-foreground">Member Profile</h3>
            <button onClick={() => setDetailView(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["User ID",    detailView.userId || "—"],
              ["Name",       detailView.name],
              ["Email",      detailView.email || "—"],
              ["Phone",      detailView.phone || "—"],
              ["Telegram",   detailView.telegram || "—"],
              ["Type",       detailView.type.replace(/_/g, " ")],
              ["Payment",    detailView.paymentMethod || "—"],
              ["Amount",     detailView.amount || "—"],
              ["UTR / TXID", detailView.utr || "—"],
              ["Status",     detailView.status],
              ["Location",   detailView.location],
              ["IP",         detailView.ipAddress],
              ["Submitted",  formatDate(detailView.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground w-24 shrink-0 text-xs">{k}</span>
                <span className="text-foreground font-medium break-all text-xs">{v}</span>
              </div>
            ))}
            {/* Screenshot */}
            {detailView.screenshotUrl ? (
              <div className="p-2.5 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                <button
                  onClick={() => setScreenshotModal(detailView.screenshotUrl!)}
                  className="block w-full overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={detailView.screenshotUrl}
                    alt="Payment proof"
                    className="w-full max-h-40 object-cover hover:opacity-80 transition-opacity"
                  />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                <ImageIcon className="w-4 h-4" /> No screenshot uploaded
              </div>
            )}
            {/* Additional details */}
            {Object.keys(detailView.details).length > 0 && (
              <div className="p-2.5 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1.5">Additional Details</p>
                {Object.entries(detailView.details).map(([k, v]) => (
                  <p key={k} className="text-xs text-foreground"><span className="capitalize text-muted-foreground">{k}:</span> {String(v)}</p>
                ))}
              </div>
            )}
          </div>
          {/* Admin controls */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border">
            {detailView.status === "pending" && (
              <>
                <Button size="sm" className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 text-xs" onClick={() => updateStatus(detailView.id, "approved")}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve Access
                </Button>
                <Button size="sm" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs" onClick={() => { updateStatus(detailView.id, "rejected"); setDetailView(null) }}>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Deactivate
                </Button>
              </>
            )}
            {detailView.status === "approved" && (
              <Button size="sm" className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs" onClick={() => updateStatus(detailView.id, "approved")}>
                <Clock className="w-3.5 h-3.5 mr-1" /> Extend Membership
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDetailView(null)} className="ml-auto text-muted-foreground text-xs">Close</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Screenshot thumbnail cell ───────────────────────────────────────────────

  const ScreenshotCell = ({ url }: { url?: string }) => {
    if (!url) return <span className="text-xs text-muted-foreground">Not uploaded</span>
    return (
      <button
        onClick={() => setScreenshotModal(url)}
        className="flex items-center gap-1.5 text-primary hover:underline text-xs"
        title="Click to enlarge"
      >
        <img src={url} alt="proof" className="w-8 h-8 rounded object-cover border border-border" />
        <ExternalLink className="w-3 h-3" />
      </button>
    )
  }

  // ── Shared table renderer ───────────────────────────────────────────────────

  const renderTable = (rows: Submission[], title: string, cols?: string[]) => {
    const headers = cols || ["User ID", "Name", "Contact", "Type / Method", "Amount", "UTR / TXID", "Screenshot", "Submitted", "Status", "Actions"]
    return (
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
                  {headers.map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={headers.length} className="py-12 text-center text-muted-foreground text-sm">No records found</td></tr>
                ) : rows.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{s.userId || generateUserId(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                      <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {s.telegram && <p className="text-xs text-foreground">{s.telegram}</p>}
                        {s.phone    && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                        {s.email    && <p className="text-xs text-muted-foreground">{s.email}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="block text-xs text-foreground capitalize">{s.type.replace(/_/g, " ")}</span>
                      {s.paymentMethod && <span className="text-xs text-muted-foreground">{s.paymentMethod}</span>}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap text-xs">{s.amount || "—"}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap max-w-[110px] truncate">{s.utr || "—"}</td>
                    <td className="py-3 px-4"><ScreenshotCell url={s.screenshotUrl} /></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${statusBadge(s.status)}`}>{s.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="View">
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
  }

  // ── Section: Dashboard ──────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total VIP Members",      value: stats.vip,       icon: Star,       color: "text-primary"    },
          { label: "Mentorship Members",      value: stats.mentorship,icon: FileText,   color: "text-blue-400"   },
          { label: "USDT Payments",           value: usdtSubs.length, icon: DollarSign, color: "text-green-400"  },
          { label: "Est. Revenue",            value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions",  value: stats.total,     icon: Hash,        color: "text-foreground" },
          { label: "Pending",            value: stats.pending,   icon: Clock,       color: "text-amber-400"  },
          { label: "Approved",           value: stats.approved,  icon: CheckCircle, color: "text-green-400"  },
          { label: "Suspicious",         value: stats.suspicious,icon: AlertTriangle,color: "text-red-400"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`p-4 rounded-xl bg-card border ${label === "Suspicious" && stats.suspicious > 0 ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* VIP Members section */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">VIP Members</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{vipSubs.length}</span>
          </div>
          <button onClick={() => setActiveSection("members-vip")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {vipSubs.slice(0, 3).map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.telegram || s.email || "—"} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className="text-xs text-foreground font-medium">{s.amount || "—"}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
          ))}
          {vipSubs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No VIP members yet</p>}
        </div>
      </div>

      {/* Mentorship Members section */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-foreground">Mentorship Members</h3>
            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{mentorshipSubs.length}</span>
          </div>
          <button onClick={() => setActiveSection("members-mentorship")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {mentorshipSubs.slice(0, 3).map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.telegram || s.email || "—"} · {s.paymentMethod} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className="text-xs text-foreground font-medium">{s.amount || "—"}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span>
            </div>
          ))}
          {mentorshipSubs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No mentorship members yet</p>}
        </div>
      </div>

      {/* USDT Payments section */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-foreground">USDT Payment Users</h3>
            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{usdtSubs.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["User ID", "Name", "Telegram", "Wallet / TXID", "Amount", "Time", "Status"].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usdtSubs.length === 0
                ? <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">No USDT payments yet</td></tr>
                : usdtSubs.slice(0, 5).map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">{s.userId || generateUserId(i)}</td>
                    <td className="py-2.5 px-4 text-xs font-medium text-foreground">{s.name}</td>
                    <td className="py-2.5 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground max-w-[120px] truncate">{s.utr || "—"}</td>
                    <td className="py-2.5 px-4 text-xs font-medium text-foreground">{s.amount || "—"}</td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span>
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

  // ── Section: Suspicious Payments ────────────────────────────────────────────

  const renderSuspicious = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h2 className="text-xl font-bold text-foreground">Suspicious / Suspected Payments</h2>
      </div>

      {suspiciousSubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-card border border-border">
          <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
          <p className="font-semibold text-foreground mb-1">No suspicious activity detected</p>
          <p className="text-sm text-muted-foreground">Duplicate UTR / TXID submissions will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">
              {suspiciousSubs.length} submission{suspiciousSubs.length > 1 ? "s" : ""} flagged — duplicate UTR / TXID detected. Manual review required before approving.
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    {["User ID", "Name", "Telegram", "Payment Method", "UTR / TXID", "Amount", "Submitted", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suspiciousSubs.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/50 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.userId || generateUserId(i)}</td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                      </td>
                      <td className="py-3 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                      <td className="py-3 px-4 text-xs text-foreground">{s.paymentMethod || "—"}</td>
                      <td className="py-3 px-4 font-mono text-xs text-red-400 font-semibold">{s.utr || "—"}</td>
                      <td className="py-3 px-4 text-xs text-foreground font-medium">{s.amount || "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Mark as valid / Approve"><UserCheck className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(s.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Decline"><UserX className="w-4 h-4" /></button>
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

  // ── Section: Users / Members ────────────────────────────────────────────────

  const renderUsers = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Users / Members</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID", "Name", "Email", "Phone", "Telegram", "Type", "Join Date", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userList.length === 0
                ? <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No users found</td></tr>
                : userList.map((u, i) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-primary">{u.userId || generateUserId(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <button onClick={() => setDetailView(u)} className="hover:text-primary hover:underline">{u.name}</button>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{u.email || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{u.phone || "—"}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{u.telegram || "—"}</td>
                    <td className="py-3 px-4 text-xs text-foreground capitalize">{u.type.replace(/_/g, " ")}</td>
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

  // ── Section: Revenue Analytics ──────────────────────────────────────────────

  const renderRevenue = () => {
    const upiCount    = approvedSubs.filter(s => s.paymentMethod?.toLowerCase().includes("upi")).length
    const cryptoCount = approvedSubs.filter(s => s.paymentMethod?.toLowerCase().includes("usdt") || s.paymentMethod?.toLowerCase().includes("trc") || s.paymentMethod?.toLowerCase().includes("bep") || s.paymentMethod?.toLowerCase().includes("binance")).length
    const erupeeCount = approvedSubs.filter(s => s.paymentMethod?.toLowerCase().includes("rupee") || s.paymentMethod?.toLowerCase().includes("e-rupee")).length
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Revenue Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue",     value: `₹${(approvedSubs.length * 4999).toLocaleString("en-IN")}`, icon: DollarSign, color: "text-green-400" },
            { label: "Approved Payments", value: approvedSubs.length,    icon: CheckCircle, color: "text-green-400" },
            { label: "VIP Sales",         value: vipSubs.filter(s => s.status === "approved" || s.status === "completed").length, icon: Star, color: "text-primary" },
            { label: "Mentorship Sales",  value: mentorshipSubs.filter(s => s.status === "approved" || s.status === "completed").length, icon: FileText, color: "text-blue-400" },
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
              {[
                { label: "UPI", count: upiCount, color: "bg-primary" },
                { label: "Crypto / USDT", count: cryptoCount, color: "bg-green-500" },
                { label: "E-Rupee", count: erupeeCount, color: "bg-amber-500" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${approvedSubs.length ? (count / approvedSubs.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Product Breakdown</h3>
            <div className="space-y-2">
              {["mentorship", "vip", "vip_group", "usdt_p2p", "funded_account"].map(type => {
                const count = submissions.filter(s => s.type === type && (s.status === "approved" || s.status === "completed")).length
                const label = type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
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

  // ── Section: Members — VIP ──────────────────────────────────────────────────

  const renderMembersVIP = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">VIP Members</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID", "Name", "Email", "Phone", "Telegram", "Join Date", "Payment", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vipSubs.length === 0
                ? <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">No VIP members yet</td></tr>
                : vipSubs.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.userId || generateUserId(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{s.email || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{s.phone || "—"}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.paymentMethod || "—"}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground">{s.amount || "—"}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Eye className="w-4 h-4" /></button>
                        {s.status === "pending" && <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10"><CheckCircle className="w-4 h-4" /></button>}
                        <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Ban className="w-4 h-4" /></button>
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

  // ── Section: Members — Mentorship ───────────────────────────────────────────

  const renderMembersMentorship = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Mentorship Members</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID", "Name", "Telegram", "Join Date", "Program", "Payment", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mentorshipSubs.length === 0
                ? <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No mentorship members yet</td></tr>
                : mentorshipSubs.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.userId || generateUserId(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{String(s.details.program || "—")}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.paymentMethod || "—"}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground">{s.amount || "—"}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Eye className="w-4 h-4" /></button>
                        {s.status === "pending" && <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10"><CheckCircle className="w-4 h-4" /></button>}
                        <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Ban className="w-4 h-4" /></button>
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

  // ── Section: Members — VIP Group ────────────────────────────────────────────

  const renderMembersVIPGroup = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">VIP Group Members</h2>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["User ID", "Name", "Telegram", "Join Date", "Payment", "Amount", "Screenshot", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vipGroupSubs.length === 0
                ? <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No VIP group members yet</td></tr>
                : vipGroupSubs.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.userId || generateUserId(i)}</td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button>
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-foreground">{s.paymentMethod || "—"}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground">{s.amount || "—"}</td>
                    <td className="py-3 px-4"><ScreenshotCell url={s.screenshotUrl} /></td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Eye className="w-4 h-4" /></button>
                        {s.status === "pending" && <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10"><CheckCircle className="w-4 h-4" /></button>}
                        <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Ban className="w-4 h-4" /></button>
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

  // ── Section: Settings ────────────────────────────────────────────────────────

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
              const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: "application/json" })
              const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "og-admin-data.json" })
              a.click()
            }}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export JSON
          </Button>
          <Button
            variant="outline" size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => { if (confirm("Clear all submissions? This cannot be undone.")) saveSubmissions([]) }}
          >
            Clear All Data
          </Button>
        </div>
      </div>
    </div>
  )

  // ── Section: Logs ────────────────────────────────────────────────────────────

  const renderLogs = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Admin Logs</h2>
      {securityLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-card border border-border">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No security logs yet.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Event", "Email", "IP Address", "Location", "Details", "Time"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {securityLogs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        log.type === "login_success"
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : log.type === "login_failed"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : log.type === "logout"
                          ? "bg-secondary text-muted-foreground border-border"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}>
                        {log.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.email || "—"}</td>
                    <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.location}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.details || "—"}</td>
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

  // ── Section router ──────────────────────────────────────────────────────────

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":            return renderDashboard()
      case "payments":             return renderTable(submissions,   "All Payments")
      case "payment-verification": return renderTable(pendingSubs,   "Payment Verification — Pending Review")
      case "suspicious":           return renderSuspicious()
      case "users":                return renderUsers()
      case "vip-access":           return renderTable(vipSubs.concat(vipGroupSubs), "VIP Access Management")
      case "revenue":              return renderRevenue()
      case "members-vip":          return renderMembersVIP()
      case "members-mentorship":   return renderMembersMentorship()
      case "members-vipgroup":     return renderMembersVIPGroup()
      case "settings":             return renderSettings()
      case "logs":                 return renderLogs()
    }
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-40 lg:hidden">
          <SidebarContent />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 h-14 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-foreground text-sm sm:text-base">
              {NAV.find(n => n.key === activeSection)?.label || "Members"}
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {renderSection()}
        </main>
      </div>

      <DetailModal />
      <ScreenshotModal />
    </div>
  )
}
