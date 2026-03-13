"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, LogOut, RefreshCw, Trash2, CheckCircle, Clock,
  Users, FileText, Star, BarChart2,
  Activity, X, ChevronRight, DollarSign, TrendingUp,
  Eye, Ban, AlertCircle, Hash,
  AlertTriangle, UserCheck, UserX, ChevronDown, ChevronUp,
  Image as ImageIcon, Bell, BellOff, Search, Download,
  ArrowUpRight, ArrowDownLeft, Menu, Folder, Lock,
  Globe, ToggleLeft, ToggleRight, Mail, Phone,
  ExternalLink, Send, Bot, Zap, Settings,
  Crown, UserPlus, Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  isSessionValid, logout, getSession, getSecurityLogs, changePassword,
} from "@/lib/admin-auth"
import type { SecurityLog } from "@/lib/admin-auth"
import {
  getVipSignals, addVipSignal, deleteVipSignal,
  getMemberships, approveMembership, revokeMembership,
  getPerformanceStats, addPerformanceStat, deletePerformanceStat,
} from "@/lib/membership-store"
import {
  loadSystemConfig, saveSystemConfig,
  loadPricing, savePricing,
  loadAdminProfile, saveAdminProfile,
  DEFAULT_PRICING,
  type PricingConfig,
} from "@/lib/admin-settings"
import type { Membership, VipSignal, PerformanceStat } from "@/lib/membership-store"
import { AdminPushPanel } from "./admin-push-panel"
import { sendPushNotification } from "./send-push-action"
import {
  listIndicators, createIndicator, updateIndicator, deleteIndicator,
} from "@/lib/indicators-store"
import type { Indicator, IndicatorCategory } from "@/lib/indicators-store"
import { AdminDataManagement } from "./admin-data-management"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard" | "usdt-buy" | "usdt-sell"
  | "payment-verification" | "suspicious" | "members"
  | "notifications" | "security" | "files"
  | "export" | "system-control" | "telegram" | "logs"
  | "signals" | "memberships" | "performance" | "indicators"
  | "analytics" | "data"
  | "mentorship-requests" | "vip-requests" | "user-profiles"

interface Submission {
  id: string
  userId?: string
  type: "usdt_p2p" | "funded_account" | "mentorship" | "vip" | "vip_group" | "support" | "member" | "other"
  name: string
  email?: string
  telegram?: string
  phone?: string
  details: Record<string, unknown>
  status: "pending" | "approved" | "rejected" | "completed" | "dismissed" | "deleted"
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
  notificationStatus?: "UNREAD" | "READ"
}

interface USDTBuyRequest {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  telegram?: string
  walletAddress: string
  txId: string
  screenshotUrl: string
  amountUsdt: string
  inrEquivalent: string
  amountPaid: string
  status: "pending" | "accepted" | "processing" | "completed" | "cancelled" | "rejected"
  createdAt: string
}

interface USDTSellRequest {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  telegram?: string
  upiId: string
  walletAddress: string
  usdtAmount: string
  txId: string
  screenshotUrl: string
  status: "pending" | "accepted" | "processing" | "completed" | "cancelled" | "rejected"
  createdAt: string
}

interface AdminNotification {
  id: string
  type: string          // DB text column — not restricted to a closed union
  title?: string
  message: string
  read: boolean
  status?: "read" | "unread"
  createdAt: string
  refId?: string
  refSection?: string   // derived from type by the API normalizer
}

// ─── Sidebar nav config ───────────────────────────────────────────────────────

const NAV: { key: Section; label: string; icon: typeof Shield; group?: string }[] = [
  { key: "dashboard",            label: "Dashboard",            icon: BarChart2      },
  { key: "payment-verification", label: "Payment Verification", icon: CheckCircle    },
  { key: "usdt-buy",             label: "USDT Buy Requests",    icon: ArrowDownLeft, group: "USDT Trading" },
  { key: "usdt-sell",            label: "USDT Sell Requests",   icon: ArrowUpRight,  group: "USDT Trading" },
  { key: "mentorship-requests",  label: "Mentorship Requests",  icon: FileText,      group: "Submissions" },
  { key: "vip-requests",         label: "VIP Group Requests",   icon: Crown,         group: "Submissions" },
  { key: "user-profiles",        label: "User Profiles",        icon: Users,         group: "Submissions" },
  { key: "suspicious",           label: "Fraud Detection",      icon: AlertTriangle  },
  { key: "members",              label: "Member Database",      icon: Users          },
  { key: "signals",              label: "Signals Manager",      icon: Star,           group: "Content" },
  { key: "memberships",          label: "Memberships",          icon: UserCheck,      group: "Content" },
  { key: "performance",          label: "Performance Manager",  icon: TrendingUp,     group: "Content" },
  { key: "indicators",           label: "Indicators Manager",   icon: BarChart2,      group: "Content" },
  { key: "notifications",        label: "Notifications",        icon: Bell           },
  { key: "files",                label: "File Manager",         icon: Folder         },
  { key: "export",               label: "Export Data",          icon: Download       },
  { key: "system-control",       label: "System Control",       icon: Globe          },
  { key: "telegram",             label: "Telegram Settings",    icon: Send           },
  { key: "security",             label: "Security Settings",    icon: Lock           },
  { key: "logs",                 label: "Admin Logs",           icon: Activity       },
  { key: "analytics",           label: "Analytics",            icon: BarChart2,      group: "Insights" },
  { key: "data",                label: "Data",                 icon: Folder,         group: "Data" },
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
    accepted:  "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled:  "bg-orange-500/10 text-orange-400 border-orange-500/30",
    rejected:   "bg-red-500/10 text-red-400 border-red-500/30",
    dismissed:  "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
    deleted:    "bg-zinc-700/20 text-zinc-500 border-zinc-600/30",
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

// ─── Demo data ─────────────────────────────────────���──────────────────────────


const DEFAULT_SYSTEM = {
  upiEnabled: true,
  cryptoEnabled: true,
  erupeeEnabled: true,
  vipPrice: "₹2,999",
  mentorshipPrice: "₹4,999",
  maintenanceMode: false,
  paymentInstructions: "Pay via UPI or Crypto and upload screenshot with UTR number.",
  telegramEnabled: true,
  notifEnabled: true,
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPanel() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [adminEmail, setAdminEmail]           = useState("sheikhahmed2724@gmail.com")
  const [isLoading, setIsLoading]             = useState(false)
  const [activeSection, setActiveSection]     = useState<Section>("dashboard")
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [usdtOpen, setUsdtOpen]               = useState(false)
  const [mounted, setMounted]                 = useState(true)

  const [submissions, setSubmissions]         = useState<Submission[]>([])
  const [usdtBuy, setUsdtBuy]                 = useState<USDTBuyRequest[]>([])
  const [usdtSell, setUsdtSell]               = useState<USDTSellRequest[]>([])
  const [kycUsers, setKycUsers]               = useState<Array<{ userId: string; name: string; email: string; createdAt: string; kycDocPan: string | null; kycDocAadhaarFront: string | null; kycDocAadhaarBack: string | null }>>([])
  const [fileCategory, setFileCategory]       = useState<"payment-mentorship" | "payment-vip" | "usdt-buy" | "usdt-sell" | "pan" | "aadhaar">("payment-mentorship")
  const [notifications, setNotifications]     = useState<AdminNotification[]>([])
  const [securityLogs, setSecurityLogs]       = useState<SecurityLog[]>([])
  const [systemSettings, setSystemSettings]   = useState(DEFAULT_SYSTEM)

  const [screenshotModal, setScreenshotModal] = useState<string | null>(null)
  const [detailView, setDetailView]           = useState<Submission | null>(null)
  const [memberSearch, setMemberSearch]       = useState("")
  const [secForm, setSecForm]                 = useState({ name: "", email: "", phone: "", oldPw: "", newPw: "", confirmPw: "" })
  const [secMsg, setSecMsg]                   = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [twoFAEnabled, setTwoFAEnabled]       = useState(false)
  const [tgTestStatus, setTgTestStatus]       = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [notifTab,     setNotifTab]           = useState<"alerts" | "broadcast">("alerts")

  // ── New section state ──────────────────────────────────────────────────────
  const [signals, setSignals]               = useState<VipSignal[]>([])
  const [membershipsData, setMembershipsData] = useState<Membership[]>([])
  const [perfStats, setPerfStats]           = useState<PerformanceStat[]>([])
  const [signalForm, setSignalForm]         = useState({ pair: "", entry: "", sl: "", tp1: "", tp2: "", tp3: "", direction: "BUY" as "BUY" | "SELL", notes: "" })
  const [signalSaving, setSignalSaving]     = useState(false)
  const [membershipSearch, setMembershipSearch] = useState("")
  const [perfForm, setPerfForm]             = useState({ month: "", monthLabel: "", profitPercent: "", winRate: "", totalTrades: "", winningTrades: "", losingTrades: "" })
  const [perfSaving, setPerfSaving]         = useState(false)
  const [newSectionLoading, setNewSectionLoading] = useState(false)

  // ── Pricing config (DB-backed) ───────────────────────────────────────────────
  const [pricingConfig, setPricingConfig]       = useState<PricingConfig>(DEFAULT_PRICING)
  const [pricingSaving, setPricingSaving]       = useState(false)
  const [pricingSaved,  setPricingSaved]        = useState(false)

  // ── DB stats for Dashboard (from analytics API) ──────────────────────────────
  const [dbStats, setDbStats]                   = useState<{
    totalUsers: number; activeMembers: number; todaySignups: number; totalVisits14d: number
    totalVipMembers: number; totalMentorship: number; totalUsdtBuy: number; totalUsdtSell: number
  } | null>(null)

  // ── Analytics state ──────────────────────────────────────────────────────────
  const [analyticsData,    setAnalyticsData]    = useState<Record<string, unknown> | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // ── Global refresh state ───────────────��─────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false)

  // ── Session countdown (30-minute window) ─────────────────────────────────────
  const [sessionSecsLeft, setSessionSecsLeft] = useState<number | null>(null)

  // ── Indicators state ─────────────────────────────────────────────────────────
  const [indicatorsList,    setIndicatorsList]    = useState<Indicator[]>([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(false)
  const [indicatorForm, setIndicatorForm] = useState({
    name: "", creator: "", category: "SMC" as IndicatorCategory,
    description: "", tradingview_link: "", thumbnail_url: "", is_published: true,
  })
  const [indicatorSaving,   setIndicatorSaving]   = useState(false)
  const [indicatorEditId,   setIndicatorEditId]   = useState<string | null>(null)
  const [indicatorMsg,      setIndicatorMsg]      = useState<{ ok: boolean; text: string } | null>(null)

  const loadData = useCallback(async (opts?: { spinning?: boolean }) => {
    if (opts?.spinning) setRefreshing(true)
    try {
      // Load all live data from Supabase-backed API routes in parallel
      const [subRes, buyRes, sellRes, notifRes] = await Promise.all([
        fetch("/api/admin/submissions").then(r => r.json()).catch(() => ({ ok: false })),
        fetch("/api/admin/usdt-buy").then(r => r.json()).catch(() => ({ ok: false })),
        fetch("/api/admin/usdt-sell").then(r => r.json()).catch(() => ({ ok: false })),
        fetch("/api/admin/notifications").then(r => r.json()).catch(() => ({ ok: false })),
      ])

      // Always use DB result — empty array if no data (no localStorage fallback)
      if (subRes.ok)   setSubmissions(subRes.data ?? [])
      if (buyRes.ok)   setUsdtBuy(buyRes.data ?? [])
      if (sellRes.ok)  setUsdtSell(sellRes.data ?? [])
      if (notifRes.ok) setNotifications(notifRes.data ?? [])
    } finally {
      if (opts?.spinning) setRefreshing(false)
    }

    setTwoFAEnabled(localStorage.getItem("og_admin_2fa") === "true")
    setSecurityLogs(getSecurityLogs())
  }, [])

  // Load Supabase-backed data when relevant sections are opened
  useEffect(() => {
    if (!isAuthenticated) return

    // Auto-mark section notifications as read when the admin opens that section.
    // We use the setter form to get the latest notifications without a closure issue.
    const sectionReadMap: Partial<Record<Section, string[]>> = {
      "mentorship-requests":  ["mentorship"],
      "vip-requests":         ["vip_membership", "vip_group"],
      "user-profiles":        ["profile_update"],
      "usdt-buy":             ["usdt_buy"],
      "usdt-sell":            ["usdt_sell"],
      "payment-verification": ["payment", "other"],
    }
    const typesToMark = sectionReadMap[activeSection]
    if (typesToMark) {
      setNotifications(prev => {
        const unreadIds = prev.filter(n => !n.read && typesToMark.includes(n.type)).map(n => n.id)
        if (!unreadIds.length) return prev
        // Persist to Supabase (fire-and-forget)
        unreadIds.forEach(id => {
          fetch("/api/admin/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          }).catch(() => {})
        })
        return prev.map(n => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
      })
    }

    if (activeSection === "signals") {
      setNewSectionLoading(true)
      getVipSignals().then(s => { setSignals(s); setNewSectionLoading(false) })
    } else if (activeSection === "memberships") {
      setNewSectionLoading(true)
      getMemberships().then(m => { setMembershipsData(m); setNewSectionLoading(false) })
    } else if (activeSection === "performance") {
      setNewSectionLoading(true)
      getPerformanceStats().then(p => { setPerfStats(p); setNewSectionLoading(false) })
    } else if (activeSection === "indicators") {
      setIndicatorsLoading(true)
      listIndicators(false).then(list => { setIndicatorsList(list); setIndicatorsLoading(false) })
    } else if (activeSection === "analytics") {
      setAnalyticsLoading(true)
      fetch("/api/admin/analytics")
        .then(r => r.json())
        .then(d => { if (d.ok) setAnalyticsData(d); })
        .finally(() => setAnalyticsLoading(false))
    } else if (activeSection === "notifications") {
      fetch("/api/admin/notifications")
        .then(r => r.json())
        .then(d => { if (d.ok) setNotifications(d.data ?? []) })
        .catch(() => {})
    } else if (
      activeSection === "payment-verification" ||
      activeSection === "mentorship-requests"  ||
      activeSection === "vip-requests"         ||
      activeSection === "user-profiles"
    ) {
      fetch("/api/admin/submissions")
        .then(r => r.json())
        .then(d => { if (d.ok) setSubmissions(d.data ?? []) })
        .catch(() => {})
    } else if (activeSection === "files") {
      // Load submissions (for payment proofs) + USDT requests + KYC users in parallel
      Promise.all([
        fetch("/api/admin/submissions").then(r => r.json()),
        fetch("/api/admin/usdt-buy").then(r => r.json()),
        fetch("/api/admin/usdt-sell").then(r => r.json()),
        import("@/lib/supabase/client").then(({ createClient }) =>
          createClient()
            .from("dashboard_users")
            .select("user_id, full_name, email, created_at, kyc_doc_pan, kyc_doc_aadhaar_front, kyc_doc_aadhaar_back")
            .order("created_at", { ascending: false })
            .limit(500)
        ),
      ]).then(([sub, buy, sell, kyc]) => {
        if (sub.ok)      setSubmissions(sub.data ?? [])
        if (buy.ok)      setUsdtBuy(buy.data ?? [])
        if (sell.ok)     setUsdtSell(sell.data ?? [])
        if (!kyc.error && kyc.data) {
          setKycUsers(kyc.data.map((u: Record<string, unknown>) => ({
            userId:             String(u.user_id  ?? ""),
            name:               String(u.full_name ?? "—"),
            email:              String(u.email     ?? ""),
            createdAt:          String(u.created_at ?? ""),
            kycDocPan:          u.kyc_doc_pan            as string | null,
            kycDocAadhaarFront: u.kyc_doc_aadhaar_front  as string | null,
            kycDocAadhaarBack:  u.kyc_doc_aadhaar_back   as string | null,
          })))
        }
      }).catch(() => {})
    } else if (activeSection === "usdt-buy") {
      fetch("/api/admin/usdt-buy")
        .then(r => r.json())
        .then(d => { if (d.ok) setUsdtBuy(d.data ?? []) })
        .catch(() => {})
    } else if (activeSection === "usdt-sell") {
      fetch("/api/admin/usdt-sell")
        .then(r => r.json())
        .then(d => { if (d.ok) setUsdtSell(d.data ?? []) })
        .catch(() => {})
    } else if (activeSection === "members") {
      // Also pull live users from Supabase to merge with localStorage demo data
      import("@/lib/supabase/client").then(({ createClient }) => {
        createClient()
          .from("dashboard_users")
          .select("user_id, full_name, email, phone, created_at, is_verified")
          .order("created_at", { ascending: false })
          .limit(200)
          .then(({ data }) => {
            if (!data?.length) return
            const liveUsers: Submission[] = data.map(u => ({
              id: String(u.user_id),
              userId: String(u.user_id),
              type: "member" as Submission["type"],
              name: String(u.full_name || "—"),
              email: String(u.email || ""),
              phone: String(u.phone || ""),
              telegram: "",
              details: {},
              status: u.is_verified ? ("approved" as const) : ("pending" as const),
              paymentMethod: "",
              amount: "",
              utr: "",
              screenshotUrl: "",
              ipAddress: "",
              location: "",
              createdAt: String(u.created_at),
            }))
            // Merge: prefer Supabase over demo entries with same userId
            setSubmissions(prev => {
              const existingIds = new Set(liveUsers.map(u => u.userId))
              const filtered = prev.filter(p => !existingIds.has(p.userId))
              return [...liveUsers, ...filtered]
            })
          })
          .catch(() => {})
      })
    }
  }, [activeSection, isAuthenticated])

  useEffect(() => {
    setMounted(true)
    setIsAuthenticated(true)
    setIsLoading(false)
    loadData()
    // Safety net: never leave the loading spinner visible more than 5s
    const loadingTimeout = setTimeout(() => setIsLoading(false), 5000)

    // Load DB-backed settings in parallel; merge both into og_site_config so
    // useSiteConfig (and all frontend pages) gets the full picture immediately.
    Promise.all([loadSystemConfig(), loadPricing()]).then(([cfg, pricing]) => {
      setSystemSettings(s => ({ ...s, ...cfg }))
      setPricingConfig(pricing)
      const merged = { ...cfg, ...pricing }
      localStorage.setItem("og_site_config", JSON.stringify(merged))
      window.dispatchEvent(new Event("og_site_config_change"))
    })
    loadAdminProfile().then(p => {
      if (p.name) setSecForm(f => ({ ...f, name: p.name }))
    })
    // Session countdown display only — no redirect on expiry
    const sessionInterval = setInterval(() => {
      setSessionSecsLeft(s => Math.max(0, s - 1))
    }, 1000)

    // Pre-fetch dashboard DB stats
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => { if (d.ok) setDbStats(d.stats) })
      .catch(() => {})

    return () => { clearInterval(sessionInterval); clearTimeout(loadingTimeout) }
  }, [router, loadData])

  // ── Telegram helpers ─────────────────────────────────────────────────────────
  const sendTelegramToUser = async (userTelegram: string | undefined, text: string) => {
    if (!userTelegram) return
    // Strip leading @ — Telegram usernames work as chat_id handles
    const chatId = userTelegram.startsWith("@") ? userTelegram : `@${userTelegram}`
    fetch("/api/telegram-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _rawText: true, message: text, userChatId: chatId }),
    }).catch(() => {})
  }

  const updateStatus = async (id: string, status: Submission["status"]) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    // Persist status change to Supabase
    fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {})
    if (detailView?.id === id) setDetailView(prev => prev ? { ...prev, status } : null)

    const sub = submissions.find(s => s.id === id)

    // ── Telegram user notification ──────────────────────────────────────
    if (sub) {
      const vipGroupLink = "https://t.me/+OgKaalVIPGroup" // update with real link if needed
      if (status === "approved") {
        const isVip = sub.type === "vip" || sub.type === "vip_group"
        const vipLine = isVip ? `\n\nJoin VIP Group: ${vipGroupLink}` : ""
        await sendTelegramToUser(
          sub.telegram,
          `<b>Payment Approved</b>\n\nHi ${sub.name || "there"},\nYour payment has been verified and approved.${vipLine}\n\n<i>— OG KAAL TRADER</i>`
        )
      } else if (status === "rejected") {
        await sendTelegramToUser(
          sub.telegram,
          `<b>Payment Rejected</b>\n\nHi ${sub.name || "there"},\nYour payment could not be verified. Please contact support if you believe this is an error.\n\n<i>— OG KAAL TRADER</i>`
        )
      }
    }

    // When approving a VIP or Mentorship payment, also activate the membership in Supabase
    if (status === "approved") {
      const sub = submissions.find(s => s.id === id)
      if (sub && (sub.type === "vip" || sub.type === "vip_group" || sub.type === "mentorship")) {
        const email = sub.email ?? String(sub.details?.email ?? "")
        if (email) {
          const supabase = (await import("@/lib/supabase/client")).createClient()

          // Find the pending membership record for this user
          const { data: rows } = await supabase
            .from("memberships")
            .select("id, plan")
            .eq("email", email)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)

          if (rows && rows.length > 0) {
            const mem = rows[0]
            await approveMembership(String(mem.id), String(mem.plan), id)
          } else {
            // No pending membership row — just mark submission approved in Supabase too
            await supabase.from("admin_submissions").update({ status: "approved" }).eq("id", id)
          }
        }
      }
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm("Permanently delete this submission? This cannot be undone.")) return
    // Remove from UI immediately for instant feedback
    setSubmissions(prev => prev.filter(s => s.id !== id))
    // Hard-delete from Supabase
    fetch("/api/admin/submissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  // Soft-delete: marks status as "deleted" so it appears in the Deleted column
  // and disappears from Fraud Detection without losing the record permanently.
  const softDeleteSubmission = (id: string) => updateStatus(id, "deleted")

  // Dismiss: marks status as "dismissed" — clears from fraud queue permanently
  const dismissSubmission = (id: string) => updateStatus(id, "dismissed")

  const USDT_BUY_MESSAGES: Record<string, { title: string; body: string }> = {
    accepted:  { title: "USDT Order Accepted",       body: "Your USDT buy order has been accepted. Please complete payment."          },
    completed: { title: "USDT Order Completed",      body: "Payment confirmed. Your USDT has been sent to your wallet."              },
    cancelled: { title: "USDT Order Cancelled",      body: "Your USDT buy request was cancelled. Contact support if needed."         },
    rejected:  { title: "USDT Order Rejected",       body: "Your USDT buy request was rejected. Please contact support."             },
  }

  const USDT_SELL_MESSAGES: Record<string, { title: string; body: string }> = {
    accepted:  { title: "USDT Sell Order Accepted",  body: "Your USDT sell order has been accepted. Processing your INR payout."     },
    completed: { title: "INR Payout Sent",           body: "Your USDT sale is complete. INR has been sent to your UPI account."      },
    cancelled: { title: "USDT Sell Order Cancelled", body: "Your USDT sell request was cancelled. Contact support if needed."        },
    rejected:  { title: "USDT Sell Order Rejected",  body: "Your USDT sell request was rejected. Please contact support."           },
  }

  const updateBuyStatus = (id: string, status: USDTBuyRequest["status"]) => {
    const order = usdtBuy.find(r => r.id === id)
    setUsdtBuy(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    // Persist to Supabase
    fetch("/api/admin/usdt-buy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {})
    // Fire targeted push notification to the affected user
    const msg = USDT_BUY_MESSAGES[status]
    if (msg && order?.userId) {
      sendPushNotification({ title: msg.title, body: msg.body, type: "usdt_p2p", user_id: order.userId })
        .catch(() => {})
    }
    // Telegram notification to user
    if (order?.telegram) {
      const tgMsg = status === "accepted"
        ? `<b>USDT Buy Order Accepted</b>\n\nYour USDT buy request has been accepted. Please complete the payment.\n\nAmount: ${order.usdtAmount ?? "N/A"}\n\n<i>— OG KAAL TRADER</i>`
        : status === "completed"
        ? `<b>USDT Order Completed</b>\n\nPayment confirmed. Your USDT has been sent to your wallet.\n\n<i>— OG KAAL TRADER</i>`
        : status === "rejected" || status === "cancelled"
        ? `<b>USDT Buy Order ${status === "rejected" ? "Rejected" : "Cancelled"}</b>\n\nYour USDT buy request was ${status}. Contact support if needed.\n\n<i>— OG KAAL TRADER</i>`
        : null
      if (tgMsg) sendTelegramToUser(order.telegram, tgMsg)
    }
  }

  const updateSellStatus = (id: string, status: USDTSellRequest["status"]) => {
    const order = usdtSell.find(r => r.id === id)
    setUsdtSell(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    // Persist to Supabase
    fetch("/api/admin/usdt-sell", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {})
    // Fire targeted push notification to the affected user
    const msg = USDT_SELL_MESSAGES[status]
    if (msg && order?.userId) {
      sendPushNotification({ title: msg.title, body: msg.body, type: "usdt_p2p", user_id: order.userId })
        .catch(() => {})
    }
    // Telegram notification to user
    if (order?.telegram) {
      const tgMsg = status === "accepted"
        ? `<b>USDT Sell Order Accepted</b>\n\nYour USDT sell request has been accepted. Processing your INR payout.\n\nAmount: ${order.usdtAmount ?? "N/A"}\n\n<i>— OG KAAL TRADER</i>`
        : status === "completed"
        ? `<b>INR Payout Sent</b>\n\nYour USDT sale is complete. INR has been sent to your account.\n\n<i>— OG KAAL TRADER</i>`
        : status === "rejected" || status === "cancelled"
        ? `<b>USDT Sell Order ${status === "rejected" ? "Rejected" : "Cancelled"}</b>\n\nYour USDT sell request was ${status}. Contact support if needed.\n\n<i>— OG KAAL TRADER</i>`
        : null
      if (tgMsg) sendTelegramToUser(order.telegram, tgMsg)
    }
  }

  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    // Persist to Supabase admin_notifications table
    fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    // Persist to Supabase — mark ALL unread notifications as read
    fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {})
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  // Navigate to the relevant section and open detail when notification is clicked
  const handleNotifClick = (notif: AdminNotification) => {
    markNotifRead(notif.id)
    if (notif.refSection) {
      setActiveSection(notif.refSection as Section)
      // If the ref points to a payment submission, open its detail modal
      if (notif.refSection === "payment-verification" || notif.refSection === "suspicious") {
        const sub = submissions.find(s => s.id === notif.refId)
        if (sub) setDetailView(sub)
      }
      // For USDT buy/sell, just navigate to the section — the row will be visible
    }
  }

  // Mark all unread notifications of a given type as read.
  // Called when admin opens a section or views a specific record.
  // Mark a single submission as READ in local state and persist to Supabase
  const markSubmissionNotifRead = (sub: Submission) => {
    if (sub.notificationStatus !== "UNREAD") return
    // Optimistic update
    setSubmissions(prev =>
      prev.map(s => s.id === sub.id ? { ...s, notificationStatus: "READ" as const } : s)
    )
    // Persist via submissions PATCH — add notification_status to update body
    fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sub.id, status: sub.status, notification_status: "READ" }),
    }).catch(() => {})
  }

  // Mark all UNREAD submissions of given types as READ (called on section open)
  const markSectionNotifsRead = (types: string[]) => {
    setSubmissions(prev => {
      const toMark = prev.filter(s => types.includes(s.type) && s.notificationStatus === "UNREAD")
      if (!toMark.length) return prev
      toMark.forEach(s => {
        fetch("/api/admin/submissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, status: s.status, notification_status: "READ" }),
        }).catch(() => {})
      })
      return prev.map(s =>
        types.includes(s.type) && s.notificationStatus === "UNREAD"
          ? { ...s, notificationStatus: "READ" as const }
          : s
      )
    })
  }

  const saveSystem = (patch: Partial<typeof DEFAULT_SYSTEM>) => {
    const updated = { ...systemSettings, ...patch }
    setSystemSettings(updated)
    localStorage.setItem("og_admin_system", JSON.stringify(updated))
    // Publish to a shared key so the rest of the site can read it
    localStorage.setItem("og_site_config", JSON.stringify(updated))
    // Notify same-tab listeners (useSiteConfig hook)
    window.dispatchEvent(new Event("og_site_config_change"))
    // Persist to Supabase admin_settings (fire-and-forget)
    saveSystemConfig(updated).catch(() => {})
  }

  const handleLogout = async () => { await logout(); router.push("/") }

  const fmtDate = (d: string) => {
    if (!mounted) return ""
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  // Telegram test notification (calls the bot API via /api/telegram-notify)
  const sendTelegramTest = async () => {
    setTgTestStatus("sending")
    try {
      const res = await fetch("/api/telegram-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "test", message: "Test notification from OG KAAL TRADER Admin Panel." }),
      })
      setTgTestStatus(res.ok ? "sent" : "error")
    } catch { setTgTestStatus("error") }
    setTimeout(() => setTgTestStatus("idle"), 4000)
  }

  const pendingSubs    = submissions.filter(s => s.status === "pending")
  const vipSubs        = submissions.filter(s => s.type === "vip" || s.type === "vip_group")
  const mentorSubs     = submissions.filter(s => s.type === "mentorship")
  const utrCounts: Record<string, string[]> = {}
  submissions.forEach(s => {
    if (s.utr && s.status !== "dismissed" && s.status !== "deleted") {
      utrCounts[s.utr] = utrCounts[s.utr] || []
      utrCounts[s.utr].push(s.id)
    }
  })
  const suspiciousSubs = submissions.filter(s =>
    s.utr && utrCounts[s.utr]?.length > 1 &&
    s.status !== "dismissed" && s.status !== "deleted"
  )
  const unreadCount    = notifications.filter(n => !n.read).length

  // Per-section unread badge counts — derived from notification_status column on each row
  const isUnread = (s: { notificationStatus?: string }) => s.notificationStatus === "UNREAD"
  const unreadBySection: Record<string, number> = {
    "usdt-buy":            usdtBuy.filter(s  => isUnread(s as { notificationStatus?: string })).length,
    "usdt-sell":           usdtSell.filter(s => isUnread(s as { notificationStatus?: string })).length,
    "mentorship-requests": submissions.filter(s => s.type === "mentorship"    && isUnread(s)).length,
    "vip-requests":        submissions.filter(s => (s.type === "vip_membership" || s.type === "vip_group") && isUnread(s)).length,
    "user-profiles":       submissions.filter(s => (s.type === "member" || s.type === "other") && isUnread(s)).length,
    "payment-verification":submissions.filter(s => (s.type === "usdt_p2p" || s.type === "support") && isUnread(s)).length,
  }

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

  // Auth removed — render immediately.

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
        <img src={url} alt="proof" className="w-8 h-8 rounded object-cover border border-border" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
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
            <h3 className="font-bold text-foreground">Payment Details</h3>
            <button onClick={() => setDetailView(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2 text-sm">
            {([
              ["User ID", detailView.userId || "—"],
              ["Name", detailView.name],
              ["Email", detailView.email || "—"],
              ["Phone", detailView.phone || "—"],
              ["Telegram", detailView.telegram || "—"],
              ["Type", detailView.type.replace(/_/g, " ")],
              ["Payment Method", detailView.paymentMethod || "—"],
              ["Amount Paid", detailView.amount || "—"],
              ["UTR / Transaction ID", detailView.utr || "—"],
              ["Status", detailView.status],
              ["Submission Time", fmtDate(detailView.createdAt)],
              ["Location", detailView.location],
              ["IP Address", detailView.ipAddress],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground w-32 shrink-0 text-xs">{k}</span>
                <span className="text-foreground font-medium break-all text-xs">{v}</span>
              </div>
            ))}
            {/* Screenshot Proof */}
            <div className="p-2.5 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-2">Screenshot Proof</p>
              {detailView.screenshotUrl ? (
                <button onClick={() => setScreenshotModal(detailView.screenshotUrl!)} className="block w-full rounded-lg border border-border overflow-hidden hover:opacity-80 transition-opacity">
                  <img src={detailView.screenshotUrl} alt="Payment proof" className="w-full max-h-40 object-cover" />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-4 h-4" /> No screenshot uploaded
                </div>
              )}
            </div>
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
            {detailView.telegram && (
              <a href={`https://t.me/${detailView.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border">
                <Send className="w-3 h-3" /> Open Telegram
              </a>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDetailView(null)} className="ml-auto text-muted-foreground text-xs">Close</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  const usdtNav = NAV.filter(n => n.group === "USDT Trading")

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

        {/* USDT accordion */}
        <div>
          <button onClick={() => setUsdtOpen(o => !o)}
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
                  {unreadBySection[key] > 0 && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">{unreadBySection[key]}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submissions group */}
        <div className="pt-1 border-t border-border" />
        <p className="px-3 pt-2 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">Submissions</p>
        {(["mentorship-requests", "vip-requests", "user-profiles"] as Section[]).map(key => {
          const item = NAV.find(n => n.key === key)!
          const badge = unreadBySection[key] ?? 0
          return (
            <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {badge > 0 && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">{badge}</span>
              )}
              {badge === 0 && activeSection === key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          )
        })}
        <div className="pt-1 border-t border-border" />

        {(["suspicious", "members", "notifications"] as Section[]).map(key => {
          const item = NAV.find(n => n.key === key)!
          return (
            <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {key === "suspicious" && suspiciousSubs.length > 0 && (
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">{suspiciousSubs.length}</span>
              )}
              {key === "notifications" && unreadCount > 0 && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
              )}
            </button>
          )
        })}

        {/* DATA section */}
        <div className="pt-1 border-t border-border" />
        <p className="px-3 pt-2 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">Data</p>
        <button onClick={() => { setActiveSection("data"); setSidebarOpen(false) }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === "data" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
          <Folder className="w-4 h-4 shrink-0" />
          Data Management
          {activeSection === "data" && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
        </button>

        <div className="pt-1 border-t border-border" />

        {(["files", "export", "system-control", "telegram", "security", "logs"] as Section[]).map(key => {
          const item = NAV.find(n => n.key === key)!
          return (
            <button key={key} onClick={() => { setActiveSection(key); setSidebarOpen(false) }}
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

      {/* Live DB stats — row 1: users */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users",       value: dbStats?.totalUsers       ?? usdtBuy.length + usdtSell.length + submissions.length || "—", icon: Users,       color: "text-blue-400"   },
          { label: "Total VIP Members", value: dbStats?.totalVipMembers  ?? vipSubs.length,    icon: Crown,       color: "text-primary"    },
          { label: "Total Mentorship",  value: dbStats?.totalMentorship  ?? mentorSubs.length, icon: FileText,    color: "text-blue-400"   },
          { label: "Signups Today",     value: dbStats?.todaySignups     ?? "—",               icon: UserPlus,    color: "text-green-400"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Live DB stats — row 2: USDT orders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "USDT Buy Orders",  value: dbStats?.totalUsdtBuy  ?? usdtBuy.length,  icon: ArrowDownLeft, color: "text-green-400" },
          { label: "USDT Sell Orders", value: dbStats?.totalUsdtSell ?? usdtSell.length, icon: ArrowUpRight,  color: "text-amber-400" },
          { label: "Pending Reviews",  value: pendingSubs.length,                         icon: Clock,         color: "text-amber-400" },
          { label: "Visits (14d)",     value: dbStats?.totalVisits14d ?? "—",             icon: BarChart2,     color: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      {/* Submission status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "All Submissions", value: submissions.length,     icon: Hash,          color: "text-foreground" },
          { label: "Pending",         value: pendingSubs.length,     icon: Clock,         color: "text-amber-400"  },
          { label: "Approved",        value: submissions.filter(s => s.status === "approved" || s.status === "completed").length, icon: CheckCircle, color: "text-green-400" },
          { label: "Suspicious",      value: suspiciousSubs.length,  icon: AlertTriangle, color: "text-red-400"    },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`p-4 rounded-xl bg-card border ${label === "Suspicious" && suspiciousSubs.length > 0 ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      {/* Recent VIP */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" /><h3 className="font-semibold text-foreground">Recent VIP / VIP Group</h3></div>
          <button onClick={() => setActiveSection("payment-verification")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {vipSubs.slice(0, 4).map(s => (
            <button key={s.id} onClick={() => { setDetailView(s); setActiveSection("payment-verification") }} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Star className="w-4 h-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.telegram || s.email || "—"} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className="text-xs font-medium text-foreground">{s.amount || "—"}</span>
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span>
            </button>
          ))}
          {vipSubs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No VIP members yet</p>}
        </div>
      </div>
      {/* Recent Mentorship */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /><h3 className="font-semibold text-foreground">Recent Mentorship</h3></div>
        </div>
        <div className="divide-y divide-border">
          {mentorSubs.slice(0, 4).map(s => (
            <button key={s.id} onClick={() => { setDetailView(s); setActiveSection("payment-verification") }} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-400" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.telegram || "—"} · {s.paymentMethod} · {timeAgo(s.createdAt)}</p>
              </div>
              <span className="text-xs font-medium text-foreground">{s.amount || "—"}</span>
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span>
            </button>
          ))}
          {mentorSubs.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted-foreground">No mentorship members yet</p>}
        </div>
      </div>
    </div>
  )

  const SubTable = ({ rows, cols, emptyMsg }: {
    rows: Submission[]
    cols: string[]
    emptyMsg: string
  }) => (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {cols.map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={cols.length} className="py-10 text-center text-muted-foreground text-sm">{emptyMsg}</td></tr>
              : rows.map((s, i) => (
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></button>
                      {s.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(s.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Reject"><Ban className="w-4 h-4" /></button>
                        </>
                      )}
                      {s.status !== "deleted" && (
                        <button onClick={() => softDeleteSubmission(s.id)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-500/10" title="Move to Deleted"><Trash2 className="w-4 h-4" /></button>
                      )}
                      {s.status === "deleted" && (
                        <button onClick={() => deleteSubmission(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Hard Delete (permanent)"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderPaymentVerification = () => {
    const cols = ["User ID","Name","Telegram","Payment Method","Amount Paid","UTR / TXID","Screenshot","Date","Actions"]
    const pending   = submissions.filter(s => s.status === "pending")
    const completed = submissions.filter(s => s.status === "approved" || s.status === "completed")
    const dismissed = submissions.filter(s => s.status === "dismissed" || s.status === "rejected")
    const deleted   = submissions.filter(s => s.status === "deleted")

    const ColHeader = ({ label, count, accent }: { label: string; count: number; accent: string }) => (
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${accent}`}>{count}</span>
      </div>
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Payment Verification</h2>
          <button
            onClick={() => loadData({ spinning: true })}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-opacity"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Pending */}
        <div>
          <ColHeader label="Pending Review" count={pending.length} accent="bg-amber-500/10 text-amber-400 border-amber-500/20" />
          <SubTable rows={pending} cols={cols} emptyMsg="No pending submissions" />
        </div>

        {/* Completed / Approved */}
        <div>
          <ColHeader label="Completed / Approved" count={completed.length} accent="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
          <SubTable rows={completed} cols={cols} emptyMsg="No completed submissions yet" />
        </div>

        {/* Dismissed / Rejected */}
        <div>
          <ColHeader label="Dismissed / Rejected" count={dismissed.length} accent="bg-zinc-500/10 text-zinc-400 border-zinc-500/20" />
          <SubTable rows={dismissed} cols={cols} emptyMsg="No dismissed submissions" />
        </div>

        {/* Deleted (soft) */}
        {deleted.length > 0 && (
          <div>
            <ColHeader label="Deleted" count={deleted.length} accent="bg-zinc-700/20 text-zinc-500 border-zinc-600/20" />
            <p className="text-xs text-muted-foreground mb-2">These rows are soft-deleted. Click the trash icon to permanently remove a record from the database.</p>
            <SubTable rows={deleted} cols={cols} emptyMsg="No deleted submissions" />
          </div>
        )}
      </div>
    )
  }

  const USDTOrderCard = ({ r, type }: { r: USDTBuyRequest | USDTSellRequest; type: "buy" | "sell" }) => {
    const isBuy = type === "buy"
    const buy   = r as USDTBuyRequest
    const sell  = r as USDTSellRequest
    return (
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${isBuy ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                {isBuy ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {isBuy ? "Buy" : "Sell"}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-1">{r.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{r.userId}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isBuy ? "text-green-400" : "text-amber-400"}`}>
              {isBuy ? buy.amountUsdt : sell.usdtAmount} USDT
            </p>
            {isBuy && <p className="text-xs text-muted-foreground">{buy.amountPaid} paid</p>}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {r.email && <><span className="text-muted-foreground">Email</span><span className="text-foreground truncate">{r.email}</span></>}
          {r.phone && <><span className="text-muted-foreground">Phone</span><span className="text-foreground">{r.phone}</span></>}
          {r.telegram && <><span className="text-muted-foreground">Telegram</span><span className="text-foreground">{r.telegram}</span></>}
          {isBuy && buy.walletAddress && <><span className="text-muted-foreground">Wallet</span><span className="text-foreground font-mono truncate" title={buy.walletAddress}>{buy.walletAddress.slice(0, 16)}…</span></>}
          {isBuy && buy.inrEquivalent && <><span className="text-muted-foreground">INR Equiv.</span><span className="text-foreground">{buy.inrEquivalent}</span></>}
          {isBuy && buy.txId && <><span className="text-muted-foreground">TX ID</span><span className="text-foreground font-mono truncate">{buy.txId}</span></>}
          {!isBuy && sell.upiId && <><span className="text-muted-foreground">UPI ID</span><span className="text-foreground font-mono">{sell.upiId}</span></>}
          {!isBuy && sell.walletAddress && <><span className="text-muted-foreground">Wallet</span><span className="text-foreground font-mono truncate" title={sell.walletAddress}>{sell.walletAddress.slice(0, 16)}…</span></>}
          {!isBuy && sell.txId && <><span className="text-muted-foreground">TX ID</span><span className="text-foreground font-mono truncate">{sell.txId}</span></>}
          <span className="text-muted-foreground">Submitted</span><span className="text-foreground">{timeAgo(r.createdAt)}</span>
        </div>

        {/* Screenshot */}
        {r.screenshotUrl && (
          <div className="pt-1"><ScreenshotCell url={r.screenshotUrl} /></div>
        )}

        {/* Action buttons — contextual by status, locked when final */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          {(r.status === "completed" || r.status === "approved") ? (
            <span className="flex-1 text-center text-xs text-green-400 font-semibold py-1.5">Order Completed</span>
          ) : (r.status === "cancelled" || r.status === "rejected") ? (
            <span className="flex-1 text-center text-xs text-red-400 font-semibold py-1.5">Order Cancelled</span>
          ) : r.status === "accepted" ? (
            isBuy ? (
              <>
                <span className="flex-1 text-center text-xs text-blue-400 font-medium py-1.5">Accepted — Waiting for Completion</span>
                <button onClick={() => updateBuyStatus(r.id, "completed")} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors"><CheckCircle className="w-3.5 h-3.5" />Complete</button>
                <button onClick={() => updateBuyStatus(r.id, "cancelled")} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"><Ban className="w-3.5 h-3.5" />Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-center text-xs text-blue-400 font-medium py-1.5">Accepted — Waiting for Completion</span>
                <button onClick={() => updateSellStatus(r.id, "completed")} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors"><CheckCircle className="w-3.5 h-3.5" />Complete</button>
                <button onClick={() => updateSellStatus(r.id, "cancelled")} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"><Ban className="w-3.5 h-3.5" />Cancel</button>
              </>
            )
          ) : (
            /* pending */
            isBuy ? (
              <>
                <button onClick={() => updateBuyStatus(r.id, "accepted")}  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"><CheckCircle className="w-3.5 h-3.5" />Accept</button>
                <button onClick={() => updateBuyStatus(r.id, "cancelled")} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"><Ban className="w-3.5 h-3.5" />Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => updateSellStatus(r.id, "accepted")}  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"><CheckCircle className="w-3.5 h-3.5" />Accept</button>
                <button onClick={() => updateSellStatus(r.id, "cancelled")} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"><Ban className="w-3.5 h-3.5" />Cancel</button>
              </>
            )
          )}
        </div>
      </div>
    )
  }

  const USDTSection = ({ label, orders, type, accent }: {
    label: string
    orders: (USDTBuyRequest | USDTSellRequest)[]
    type: "buy" | "sell"
    accent: string
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${accent}`}>{orders.length}</span>
      </div>
      {orders.length === 0
        ? <div className="rounded-xl border border-border border-dashed py-8 text-center text-muted-foreground text-sm">No orders in this category</div>
        : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(r => <USDTOrderCard key={r.id} r={r} type={type} />)}
          </div>
      }
    </div>
  )

  // ── Shared Transaction History panel ─────────────────────────────────────────
  const TransactionHistory = ({
    orders,
    type,
  }: {
    orders: (USDTBuyRequest | USDTSellRequest)[]
    type: "buy" | "sell"
  }) => {
    const [historyTab,   setHistoryTab]   = useState<"pending" | "completed" | "cancelled">("pending")
    const [historySearch, setHistorySearch] = useState("")
    const [historyDate,  setHistoryDate]  = useState("")

    const tabOrders = orders.filter(r => {
      if (historyTab === "pending")   return r.status === "pending" || r.status === "accepted" || r.status === "processing"
      if (historyTab === "completed") return r.status === "completed" || r.status === "approved"
      if (historyTab === "cancelled") return r.status === "cancelled" || r.status === "rejected"
      return true
    }).filter(r => {
      const q = historySearch.toLowerCase()
      if (!q) return true
      return (
        r.userId.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)   ||
        r.email.toLowerCase().includes(q)  ||
        r.id.toLowerCase().includes(q)
      )
    }).filter(r => {
      if (!historyDate) return true
      return r.createdAt.startsWith(historyDate)
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const tabCounts = {
      pending:   orders.filter(r => ["pending","accepted","processing"].includes(r.status)).length,
      completed: orders.filter(r => ["completed","approved"].includes(r.status)).length,
      cancelled: orders.filter(r => ["cancelled","rejected"].includes(r.status)).length,
    }

    const statusColor: Record<string, string> = {
      pending:    "bg-amber-500/10 text-amber-400 border-amber-500/30",
      accepted:   "bg-blue-500/10 text-blue-400 border-blue-500/30",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      completed:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      approved:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      cancelled:  "bg-red-500/10 text-red-400 border-red-500/30",
      rejected:   "bg-red-500/10 text-red-400 border-red-500/30",
    }

    const apiPath = type === "buy" ? "/api/admin/usdt-buy" : "/api/admin/usdt-sell"

    const handleStatusAction = async (id: string, newStatus: string) => {
      await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (type === "buy") {
        setUsdtBuy(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as USDTBuyRequest["status"] } : r))
      } else {
        setUsdtSell(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as USDTSellRequest["status"] } : r))
      }
    }

    return (
      <div className="rounded-xl bg-card border border-border flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Transaction History</h3>
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{orders.length} total</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
            {(["pending","completed","cancelled"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors ${historyTab === tab ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="capitalize">{tab}</span>
                <span className={`text-xs px-1.5 py-0 rounded-full font-bold ${
                  tab === "pending"   ? "bg-amber-500/20 text-amber-400"   :
                  tab === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-red-500/20 text-red-400"
                }`}>{tabCounts[tab]}</span>
              </button>
            ))}
          </div>

          {/* Search + Date */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search by user, email, ID..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <input
              type="date"
              value={historyDate}
              onChange={e => setHistoryDate(e.target.value)}
              className="px-2 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 w-36"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {tabOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No {historyTab} transactions</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {["User","Amount","Method","Status","Date","Actions"].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabOrders.map(r => {
                  const amount = type === "buy"
                    ? (r as USDTBuyRequest).amountUsdt
                    : (r as USDTSellRequest).usdtAmount
                  const method = type === "buy" ? "UPI/Bank" : "USDT→INR"
                  const d = new Date(r.createdAt)
                  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })

                  return (
                    <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-foreground truncate max-w-[80px]">{r.name}</div>
                        <div className="text-muted-foreground font-mono truncate max-w-[80px]">{r.userId || "—"}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">{amount} USDT</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{method}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-1.5 py-0.5 rounded border font-medium capitalize ${statusColor[r.status] ?? "bg-secondary text-foreground border-border"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        <div>{date}</div>
                        <div>{time}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {historyTab === "pending" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStatusAction(r.id, "completed")}
                              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Complete"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStatusAction(r.id, "accepted")}
                              className="p-1 rounded text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Approve"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStatusAction(r.id, "cancelled")}
                              className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  const renderUSDTBuy = () => {
    const pending   = usdtBuy.filter(r => r.status === "pending")
    const accepted  = usdtBuy.filter(r => r.status === "accepted")
    const completed = usdtBuy.filter(r => r.status === "completed" || r.status === "approved")
    const cancelled = usdtBuy.filter(r => r.status === "cancelled" || r.status === "rejected")
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ArrowDownLeft className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-foreground">USDT Buy Requests</h2>
            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-semibold border border-green-500/20">{usdtBuy.length}</span>
          </div>
          <button
            onClick={() => { setRefreshing(true); fetch("/api/admin/usdt-buy").then(r => r.json()).then(d => { if (d.ok && d.data) setUsdtBuy(d.data) }).finally(() => setRefreshing(false)) }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Users buying USDT from you — verify payment then complete the order.</p>

        {/* Two-column layout: orders left, history right */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Left — order cards */}
          <div className="space-y-6 min-w-0">
            <USDTSection label="Pending Requests"  orders={pending}   type="buy" accent="bg-amber-500/10 text-amber-400 border-amber-500/20" />
            <USDTSection label="Accepted Orders"   orders={accepted}  type="buy" accent="bg-blue-500/10 text-blue-400 border-blue-500/20" />
            <USDTSection label="Completed Orders"  orders={completed} type="buy" accent="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
            {cancelled.length > 0 && <USDTSection label="Cancelled / Rejected" orders={cancelled} type="buy" accent="bg-red-500/10 text-red-400 border-red-500/20" />}
          </div>
          {/* Right — history panel */}
          <div className="xl:sticky xl:top-4">
            <TransactionHistory orders={usdtBuy} type="buy" />
          </div>
        </div>
      </div>
    )
  }

  const renderUSDTSell = () => {
    const pending   = usdtSell.filter(r => r.status === "pending")
    const accepted  = usdtSell.filter(r => r.status === "accepted")
    const completed = usdtSell.filter(r => r.status === "completed" || r.status === "approved")
    const cancelled = usdtSell.filter(r => r.status === "cancelled" || r.status === "rejected")
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-foreground">USDT Sell Requests</h2>
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">{usdtSell.length}</span>
          </div>
          <button
            onClick={() => { setRefreshing(true); fetch("/api/admin/usdt-sell").then(r => r.json()).then(d => { if (d.ok && d.data) setUsdtSell(d.data) }).finally(() => setRefreshing(false)) }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Users selling USDT to you — verify their USDT transfer then send INR to their UPI.</p>

        {/* Two-column layout: orders left, history right */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Left — order cards */}
          <div className="space-y-6 min-w-0">
            <USDTSection label="Pending Requests"  orders={pending}   type="sell" accent="bg-amber-500/10 text-amber-400 border-amber-500/20" />
            <USDTSection label="Accepted Orders"   orders={accepted}  type="sell" accent="bg-blue-500/10 text-blue-400 border-blue-500/20" />
            <USDTSection label="Completed Orders"  orders={completed} type="sell" accent="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
            {cancelled.length > 0 && <USDTSection label="Cancelled / Rejected" orders={cancelled} type="sell" accent="bg-red-500/10 text-red-400 border-red-500/20" />}
          </div>
          {/* Right — history panel */}
          <div className="xl:sticky xl:top-4">
            <TransactionHistory orders={usdtSell} type="sell" />
          </div>
        </div>
      </div>
    )
  }

  const renderSuspicious = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h2 className="text-xl font-bold text-foreground">Fraud Detection</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Duplicate UTR / TXID", value: suspiciousSubs.length, color: "text-red-400"     },
          { label: "Total Submissions",    value: submissions.length,    color: "text-foreground"  },
          { label: "Under Review",         value: pendingSubs.length,    color: "text-amber-400"   },
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
            <p className="text-sm text-red-400">{suspiciousSubs.length} submission{suspiciousSubs.length > 1 ? "s" : ""} flagged — duplicate UTR / TXID detected.</p>
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
                      <td className="py-3 px-4 font-medium text-foreground"><button onClick={() => setDetailView(s)} className="hover:text-primary hover:underline">{s.name}</button></td>
                      <td className="py-3 px-4 font-mono text-xs text-red-400 font-semibold">{s.utr || "—"}</td>
                      <td className="py-3 px-4 text-xs text-red-300">Duplicate UTR / TXID</td>
                      <td className="py-3 px-4 text-xs text-foreground">{s.paymentMethod || "—"}</td>
                      <td className="py-3 px-4 text-xs font-medium text-foreground">{s.amount || "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDetailView(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View Details"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve — mark as legitimate"><UserCheck className="w-4 h-4" /></button>
                          <button
                            onClick={() => dismissSubmission(s.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-500/10"
                            title="Dismiss — removes from fraud queue permanently (saved as dismissed in DB)"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => softDeleteSubmission(s.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                            title="Delete — moves to Deleted column in Payment Verification (soft delete)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Member Database</h2>
        <button
          onClick={() => loadData({ spinning: true })}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
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
                    <td className="py-3 px-4 font-medium text-foreground"><button onClick={() => setDetailView(u)} className="hover:text-primary hover:underline">{u.name}</button></td>
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
      if (type === "vip")        return <Star className="w-4 h-4 text-primary" />
      if (type === "mentorship") return <FileText className="w-4 h-4 text-blue-400" />
      if (type === "usdt")       return <DollarSign className="w-4 h-4 text-green-400" />
      return <AlertTriangle className="w-4 h-4 text-red-400" />
    }
    const notifSectionLabel = (n: AdminNotification) => {
      if (n.refSection === "payment-verification") return "View payment details"
      if (n.refSection === "usdt-buy")  return "View USDT buy request"
      if (n.refSection === "usdt-sell") return "View USDT sell request"
      if (n.refSection === "suspicious") return "View fraud alert"
      return "View details"
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            {unreadCount > 0 && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setRefreshing(true); fetch("/api/admin/notifications").then(r => r.json()).then(d => { if (d.ok && d.data) setNotifications(d.data) }).finally(() => setRefreshing(false)) }}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => saveSystem({ notifEnabled: !systemSettings.notifEnabled })}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${systemSettings.notifEnabled ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>
              {systemSettings.notifEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {systemSettings.notifEnabled ? "Notifs On" : "Notifs Off"}
            </button>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-border w-fit">
          {(["alerts", "broadcast"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setNotifTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${notifTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "alerts" ? "Admin Alerts" : "Push Broadcast"}
            </button>
          ))}
        </div>

        {notifTab === "alerts" && (
          <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
            {notifications.length === 0
              ? <div className="py-16 text-center text-muted-foreground text-sm">No notifications yet</div>
              : notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-secondary/40 ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <button
                    onClick={() => handleNotifClick(n)}
                    className="flex items-start gap-4 flex-1 min-w-0 text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">{notifIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                      <p className="text-xs text-primary mt-0.5">{notifSectionLabel(n)} →</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete notification permanently"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {notifTab === "broadcast" && (
          <div className="rounded-xl bg-card border border-border p-5">
            <AdminPushPanel />
          </div>
        )}
      </div>
    )
  }

  const renderFiles = () => {
    type FileEntry = { id: string; userId: string; name: string; email: string; url: string; label: string; createdAt: string }

    const CATEGORIES: { key: typeof fileCategory; label: string; icon: React.ReactNode; desc: string }[] = [
      { key: "payment-mentorship", label: "Payment Proof — Mentorship",  icon: <FileText className="w-4 h-4" />,  desc: "Screenshots from mentorship payment submissions" },
      { key: "payment-vip",        label: "Payment Proof — VIP Group",   icon: <Crown className="w-4 h-4" />,     desc: "Screenshots from VIP group payment submissions" },
      { key: "usdt-buy",           label: "USDT Proof — Buy",            icon: <ArrowDownLeft className="w-4 h-4" />, desc: "Payment screenshots from USDT buy transactions" },
      { key: "usdt-sell",          label: "USDT Proof — Sell",           icon: <ArrowUpRight className="w-4 h-4" />,  desc: "Payment screenshots from USDT sell transactions" },
      { key: "pan",                label: "PAN Card",                    icon: <Shield className="w-4 h-4" />,    desc: "PAN card images uploaded during KYC verification" },
      { key: "aadhaar",            label: "Aadhaar Card",                icon: <UserCheck className="w-4 h-4" />, desc: "Aadhaar card images uploaded during KYC verification" },
    ]

    const filesByCategory: Record<typeof fileCategory, FileEntry[]> = {
      "payment-mentorship": submissions
        .filter(s => s.screenshotUrl && s.type === "mentorship")
        .map(s => ({ id: s.id, userId: s.userId || "—", name: s.name, email: s.email || "—", url: s.screenshotUrl!, label: "Mentorship Payment", createdAt: s.createdAt })),
      "payment-vip": submissions
        .filter(s => s.screenshotUrl && (s.type === "vip_membership" || s.type === "vip_group"))
        .map(s => ({ id: s.id, userId: s.userId || "—", name: s.name, email: s.email || "—", url: s.screenshotUrl!, label: "VIP Payment", createdAt: s.createdAt })),
      "usdt-buy": usdtBuy
        .filter(r => r.screenshotUrl)
        .map(r => ({ id: r.id, userId: r.userId, name: r.name, email: r.email || "—", url: r.screenshotUrl!, label: "USDT Buy Proof", createdAt: r.createdAt })),
      "usdt-sell": usdtSell
        .filter(r => r.screenshotUrl)
        .map(r => ({ id: r.id, userId: r.userId, name: r.name, email: r.email || "—", url: r.screenshotUrl!, label: "USDT Sell Proof", createdAt: r.createdAt })),
      "pan": kycUsers
        .filter(u => u.kycDocPan)
        .map(u => ({ id: u.userId + "-pan", userId: u.userId, name: u.name, email: u.email, url: u.kycDocPan!, label: "PAN Card", createdAt: u.createdAt })),
      "aadhaar": kycUsers
        .flatMap(u => [
          u.kycDocAadhaarFront ? { id: u.userId + "-aadhar-front", userId: u.userId, name: u.name, email: u.email, url: u.kycDocAadhaarFront, label: "Aadhaar (Front)", createdAt: u.createdAt } : null,
          u.kycDocAadhaarBack  ? { id: u.userId + "-aadhar-back",  userId: u.userId, name: u.name, email: u.email, url: u.kycDocAadhaarBack,  label: "Aadhaar (Back)",  createdAt: u.createdAt } : null,
        ].filter(Boolean) as FileEntry[]),
    }

    const activeFiles = filesByCategory[fileCategory]
    const activeCat   = CATEGORIES.find(c => c.key === fileCategory)!

    return (
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-foreground">File Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse uploaded proof files organized by category. Click any file to preview.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const count = filesByCategory[cat.key].length
            const active = fileCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setFileCategory(cat.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-border/80"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active category info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {activeCat.icon}
          <span>{activeCat.desc}</span>
          <span className="ml-auto font-mono text-foreground">{activeFiles.length} file{activeFiles.length !== 1 ? "s" : ""}</span>
        </div>

        {/* File grid */}
        {activeFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border text-center gap-3">
            <Folder className="w-10 h-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">No files in this category</p>
            <p className="text-sm text-muted-foreground max-w-sm">{activeCat.desc}. Files appear here automatically once users submit forms with uploads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeFiles.map(f => (
              <div key={f.id} className="rounded-xl bg-card border border-border overflow-hidden flex flex-col">
                {/* Thumbnail */}
                <div
                  className="h-44 bg-secondary/50 relative flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={() => setScreenshotModal(f.url)}
                >
                  <img
                    src={f.url}
                    alt={f.label}
                    className="h-full w-full object-cover absolute inset-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                  />
                  <ImageIcon className="w-10 h-10 text-muted-foreground relative z-10" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center z-20">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Meta */}
                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">{f.userId}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(f.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <button
                      onClick={() => setScreenshotModal(f.url)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <a
                      href={f.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderExport = () => {
    const exports = [
      { label: "Members Database", desc: "All registered members with contact info and membership status", count: userList.length, action: () => downloadCSV(userList.map(u => ({ userId: u.userId, name: u.name, email: u.email || "", phone: u.phone || "", telegram: u.telegram || "", type: u.type, status: u.status, joined: u.createdAt })), "members.csv") },
      { label: "Payment Records",  desc: "All payment submissions including status, amounts, and UTR numbers", count: submissions.length, action: () => downloadCSV(submissions.map(s => ({ id: s.id, userId: s.userId, name: s.name, method: s.paymentMethod, amount: s.amount, utr: s.utr, status: s.status, date: s.createdAt })), "payments.csv") },
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
        <p className="text-xs text-muted-foreground">Toggles persist to <code className="font-mono bg-secondary px-1 rounded">og_site_config</code> in localStorage and are read by the payment pages in real-time.</p>
        {([
          { key: "upiEnabled"    as const, label: "UPI Payments",           desc: "Enables/disables UPI payment option on checkout"           },
          { key: "cryptoEnabled" as const, label: "Crypto / USDT Payments", desc: "Enables/disables Crypto and USDT payment options"          },
          { key: "erupeeEnabled" as const, label: "E-Rupee (Digital Rupee)", desc: "Enables/disables RBI Digital Rupee payment option"        },
        ]).map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="text-sm text-foreground font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <button
              onClick={() => saveSystem({ [key]: !systemSettings[key] })}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${systemSettings[key] ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
              {systemSettings[key] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {systemSettings[key] ? "Enabled" : "Disabled"}
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
          <div>
            <p className="text-sm text-foreground font-medium">Admin Notifications</p>
            <p className="text-xs text-muted-foreground">Receive notifications for new payments, USDT requests, and fraud alerts</p>
          </div>
          <button
            onClick={() => saveSystem({ notifEnabled: !systemSettings.notifEnabled })}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${systemSettings.notifEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
            {systemSettings.notifEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {systemSettings.notifEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Pricing — All Plans</h3>
          <div className="flex items-center gap-2">
            {pricingSaving && <span className="text-xs text-primary animate-pulse">Saving...</span>}
            {pricingSaved && <span className="text-xs text-green-400">Saved to database</span>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Edit prices below then click Save. Changes are written directly to the database and reflected immediately on all frontend pages.</p>
        {([
          { key: "vip_signal_xm_existing" as keyof PricingConfig, label: "VIP Group — XM Existing User",   group: "VIP Group" },
          { key: "vip_signal_xm_new"      as keyof PricingConfig, label: "VIP Group — XM New User",         group: "VIP Group" },
          { key: "funded_account"         as keyof PricingConfig, label: "VIP Group — Funded Account User", group: "VIP Group" },
          { key: "vip_signal"             as keyof PricingConfig, label: "VIP Signals",                      group: "Other"     },
          { key: "mentorship_1"           as keyof PricingConfig, label: "Mentorship 1.0",                   group: "Mentorship" },
          { key: "mentorship_2"           as keyof PricingConfig, label: "Mentorship 2.0",                   group: "Mentorship" },
          { key: "crypto_mentorship"      as keyof PricingConfig, label: "Crypto Mentorship",                group: "Mentorship" },
        ]).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <label className="text-sm text-foreground w-56 shrink-0">{label}</label>
            <input
              value={pricingConfig[key]}
              onChange={e => setPricingConfig(p => ({ ...p, [key]: e.target.value }))}
              placeholder="e.g. ₹2,000"
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        ))}
        <button
          onClick={async () => {
            // Capture current state snapshot — avoids async stale-closure bug
            const snapshot = { ...pricingConfig }
            setPricingSaving(true)
            setPricingSaved(false)
            await savePricing(snapshot)
            // Bust frontend cache: write merged config to localStorage and fire event
            const merged = { ...systemSettings, ...snapshot }
            localStorage.setItem("og_site_config", JSON.stringify(merged))
            window.dispatchEvent(new Event("og_site_config_change"))
            setPricingSaving(false)
            setPricingSaved(true)
            setTimeout(() => setPricingSaved(false), 3000)
          }}
          disabled={pricingSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pricingSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {pricingSaving ? "Saving..." : "Save Prices"}
        </button>
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
            <p className="text-xs text-muted-foreground mt-0.5">When enabled, users will see a maintenance message.</p>
          </div>
          <button onClick={() => saveSystem({ maintenanceMode: !systemSettings.maintenanceMode })}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${systemSettings.maintenanceMode ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
            {systemSettings.maintenanceMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {systemSettings.maintenanceMode ? "Active" : "Inactive"}
          </button>
        </div>
      </div>
    </div>
  )

  const renderTelegram = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Send className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Telegram Settings</h2>
      </div>
      {/* Bot Info */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Bot Status</h3>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${systemSettings.telegramEnabled ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-secondary text-muted-foreground border border-border"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${systemSettings.telegramEnabled ? "bg-green-400" : "bg-muted-foreground"}`} />
            {systemSettings.telegramEnabled ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="space-y-3">
          {[
            { label: "Bot Username",   value: "@OGKAALBOT",     link: "https://t.me/OGKAALBOT" },
            { label: "VIP Group",      value: "t.me/OgKaal",    link: "https://t.me/OgKaal"    },
            { label: "Admin Chat ID",  value: "8197983781",     link: null                     },
          ].map(({ label, value, link }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">{label}</span>
              {link
                ? <a href={link} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline flex items-center gap-1">{value} <ExternalLink className="w-3 h-3" /></a>
                : <span className="font-mono text-xs text-foreground">{value}</span>
              }
            </div>
          ))}
        </div>
      </div>
      {/* Enable/Disable toggle */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Telegram Notifications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Send automatic notifications to admin and users via @OGKAALBOT</p>
          </div>
          <button
            onClick={() => saveSystem({ telegramEnabled: !systemSettings.telegramEnabled })}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${systemSettings.telegramEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
            {systemSettings.telegramEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {systemSettings.telegramEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
      {/* Test notification */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Test Notification</h3>
        <p className="text-xs text-muted-foreground">Send a test message to the configured Telegram chat to verify the bot token and chat ID are working correctly.</p>
        <Button
          onClick={sendTelegramTest}
          disabled={tgTestStatus === "sending"}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
        >
          {tgTestStatus === "sending" ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
          {tgTestStatus === "sending" ? "Sending..." : tgTestStatus === "sent" ? "Sent Successfully!" : tgTestStatus === "error" ? "Failed — check token/chat ID" : "Send Test Message"}
        </Button>
        {tgTestStatus === "sent" && (
          <p className="text-xs text-green-400">Message delivered. Check your Telegram channel/group.</p>
        )}
        {tgTestStatus === "error" && (
          <p className="text-xs text-red-400">Delivery failed. Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in project environment variables, and confirm the bot is an admin in your channel/group.</p>
        )}
      </div>
      {/* What gets notified */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Notification Events</h3>
        <div className="space-y-2">
          {[
            { event: "New VIP payment received",       dir: "→ Admin",              color: "text-primary"   },
            { event: "New Mentorship payment received", dir: "→ Admin",              color: "text-blue-400"  },
            { event: "New USDT buy request",           dir: "→ Admin",              color: "text-green-400" },
            { event: "New USDT sell request",          dir: "→ Admin",              color: "text-amber-400" },
            { event: "Payment Approved",               dir: "→ User + VIP link",    color: "text-green-400" },
            { event: "Payment Rejected",               dir: "→ User",               color: "text-red-400"   },
          ].map(({ event, dir, color }) => (
            <div key={event} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 text-xs">
              <span className="text-foreground">{event}</span>
              <span className={`font-medium ${color}`}>{dir}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Setup instructions */}
      <div className="rounded-xl bg-secondary/50 border border-border p-5 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Setup Instructions</h3>
        </div>
        <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
          <li><code className="font-mono bg-card px-1 rounded">TELEGRAM_BOT_TOKEN</code> — set to your bot token (already configured)</li>
          <li><code className="font-mono bg-card px-1 rounded">TELEGRAM_CHAT_ID</code> — set to your channel or group numeric ID (e.g. <code className="font-mono bg-card px-1 rounded">-100xxxxxxxxxx</code> for channels/groups)</li>
          <li>Add @OGKAALBOT to your Telegram channel or group and promote it to <strong className="text-foreground">Admin</strong> so it can post messages</li>
          <li>Use "Send Test Message" above to verify the connection — a message should appear in your channel/group instantly</li>
          <li>To find your group/channel ID: forward any message from it to @userinfobot on Telegram</li>
        </ol>
      </div>
    </div>
  )

  const renderSecurity = () => {
    const failedLogins = securityLogs.filter(l => !l.success).length
    const activeSessions = isSessionValid() ? 1 : 0

    const handleSecSave = async () => {
      if (secForm.newPw && secForm.newPw !== secForm.confirmPw) {
        setSecMsg({ type: "err", text: "New passwords do not match." }); return
      }
      if (secForm.newPw) {
        const result = await changePassword(secForm.oldPw, secForm.newPw)
        if (!result.success) { setSecMsg({ type: "err", text: result.error ?? "Current password incorrect." }); return }
      }
      // Persist admin profile (name, phone) to Supabase
      saveAdminProfile({ name: secForm.name, phone: secForm.phone }).catch(() => {})
      setSecMsg({ type: "ok", text: "Settings saved successfully." })
      setTimeout(() => setSecMsg(null), 3000)
    }

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Security Settings</h2>

        {secMsg && (
          <div className={`p-3 rounded-lg border text-sm ${secMsg.type === "ok" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>{secMsg.text}</div>
        )}

        {/* Session stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Sessions",   value: activeSessions, color: "text-green-400" },
            { label: "Failed Login Attempts", value: failedLogins,   color: failedLogins > 0 ? "text-red-400" : "text-foreground" },
            { label: "Total Log Entries",  value: securityLogs.length, color: "text-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Account Details */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Account Details</h3>
          {([
            { key: "name"  as const, label: "Admin Name",   icon: Users },
            { key: "email" as const, label: "Email Address", icon: Mail  },
            { key: "phone" as const, label: "Phone Number",  icon: Phone },
          ]).map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-muted-foreground w-32 shrink-0">{label}</label>
              <input value={secForm[key]} onChange={e => setSecForm(f => ({ ...f, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          ))}
        </div>

        {/* 2FA toggle */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Two-Step Verification (2FA)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {twoFAEnabled
                  ? "2FA is enabled. Login requires password + OTP sent to your registered phone number."
                  : "Enable 2FA to require a one-time password in addition to your main password when logging in."}
              </p>
            </div>
            <button
              onClick={() => { const next = !twoFAEnabled; setTwoFAEnabled(next); localStorage.setItem("og_admin_2fa", String(next)) }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${twoFAEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
              {twoFAEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {twoFAEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          {twoFAEnabled && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-400">
              2FA is active. On next login, an OTP will be sent to {secForm.phone || "your registered phone number"} for verification.
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Change Password</h3>
          {([
            { key: "oldPw"     as const, label: "Current Password" },
            { key: "newPw"     as const, label: "New Password"     },
            { key: "confirmPw" as const, label: "Confirm Password" },
          ]).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <label className="text-sm text-muted-foreground w-32 shrink-0">{label}</label>
              <input type="password" value={secForm[key]} onChange={e => setSecForm(f => ({ ...f, [key]: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          ))}
        </div>

        <Button onClick={handleSecSave} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Save Changes</Button>

        {/* Login History */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Login Session History</h3>
            </div>
            {failedLogins > 0 && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">{failedLogins} failed</span>
            )}
          </div>
          <div className="divide-y divide-border">
            {securityLogs.slice(0, 15).map(log => (
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

  // ── Analytics ─────────��──────────────────────────────────────────────���────────
  const renderAnalytics = () => {
    const stats  = (analyticsData as Record<string, unknown> | null)?.stats  as Record<string, number> | undefined
    const recent    = (analyticsData as Record<string, unknown> | null)?.recentSignups  as Record<string, unknown>[] | undefined
    const visitors  = (analyticsData as Record<string, unknown> | null)?.visitors14d   as { date: string; count: number }[] | undefined
    const signupsTrend = (analyticsData as Record<string, unknown> | null)?.signups14d as { date: string; count: number }[] | undefined
    const plans     = (analyticsData as Record<string, unknown> | null)?.planBreakdown as { plan: string; count: number }[] | undefined

    const statCards: { label: string; value: number | undefined; icon: typeof Users; color: string }[] = [
      { label: "Total Registered Users", value: stats?.totalUsers,      icon: Users,      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"  },
      { label: "Verified Emails",        value: stats?.verifiedUsers,   icon: CheckCircle, color: "text-green-400 bg-green-500/10 border-green-500/20" },
      { label: "Active Members",         value: stats?.activeMembers,   icon: Crown,       color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Site Visits (14 days)",  value: stats?.totalVisits14d,  icon: BarChart2,   color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
      { label: "Signups Today",          value: stats?.todaySignups,    icon: UserPlus,    color: "text-primary bg-primary/10 border-primary/20"      },
      { label: "Total Memberships",      value: stats?.totalMembers,    icon: Star,        color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    ]

    // Simple bar chart using div widths
    const maxVisitors = visitors ? Math.max(1, ...visitors.map(v => v.count)) : 1
    const maxSignups  = signupsTrend ? Math.max(1, ...signupsTrend.map(v => v.count)) : 1

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <button
            onClick={() => {
              setAnalyticsLoading(true)
              fetch("/api/admin/analytics").then(r => r.json()).then(d => { if (d.ok) setAnalyticsData(d) }).finally(() => setAnalyticsLoading(false))
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${analyticsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {analyticsLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading analytics...</div>
        ) : !analyticsData ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No data available. Click Refresh to load.</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground leading-none">{value ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visitor chart (14 days) */}
            {visitors && visitors.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">Site Visitors — Last 14 Days</h3>
                <div className="flex items-end gap-1.5 h-28">
                  {visitors.map(({ date, count }) => (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group" title={`${date}: ${count}`}>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div
                        className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                        style={{ height: `${Math.max(4, Math.round((count / maxVisitors) * 96))}px` }}
                      />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap hidden sm:block">
                        {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signups trend (14 days) */}
            {signupsTrend && signupsTrend.some(v => v.count > 0) && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">New Signups — Last 14 Days</h3>
                <div className="flex items-end gap-1.5 h-28">
                  {signupsTrend.map(({ date, count }) => (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group" title={`${date}: ${count}`}>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div
                        className="w-full rounded-t bg-green-500/60 hover:bg-green-500 transition-colors"
                        style={{ height: `${Math.max(4, Math.round((count / maxSignups) * 96))}px` }}
                      />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap hidden sm:block">
                        {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan breakdown */}
            {plans && plans.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Active Memberships by Plan</h3>
                <div className="space-y-2.5">
                  {plans.map(({ plan, count }) => {
                    const total = plans.reduce((s, p) => s + p.count, 0)
                    const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={plan} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground font-medium">{plan}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent signups */}
            {recent && recent.length > 0 && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground text-sm">Recent Signups</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        {["User ID", "Name", "Email", "Verified", "Joined"].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((u) => (
                        <tr key={String(u.user_id)} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{String(u.user_id)}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{String(u.full_name || "—")}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{String(u.email || "—")}</td>
                          <td className="py-3 px-4">
                            {u.is_verified
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs bg-green-500/10 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3" />Yes</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3" />No</span>
                            }
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(String(u.created_at))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ── Signals Manager ────────────────────────────────────────────────────���─────
  const renderSignals = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Signals Manager</h2>

      {/* Add signal form */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Post New Signal</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Pair</label>
            <input value={signalForm.pair} onChange={e => setSignalForm(f => ({ ...f, pair: e.target.value }))} placeholder="XAUUSD" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Direction</label>
            <select value={signalForm.direction} onChange={e => setSignalForm(f => ({ ...f, direction: e.target.value as "BUY" | "SELL" }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Entry</label>
            <input value={signalForm.entry} onChange={e => setSignalForm(f => ({ ...f, entry: e.target.value }))} placeholder="2365" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Stop Loss</label>
            <input value={signalForm.sl} onChange={e => setSignalForm(f => ({ ...f, sl: e.target.value }))} placeholder="2355" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Take Profit 1</label>
            <input value={signalForm.tp1} onChange={e => setSignalForm(f => ({ ...f, tp1: e.target.value }))} placeholder="2385" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Take Profit 2 (opt)</label>
            <input value={signalForm.tp2} onChange={e => setSignalForm(f => ({ ...f, tp2: e.target.value }))} placeholder="2400" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
          <input value={signalForm.notes} onChange={e => setSignalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Risk 1%, wait for retest..." className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        <Button
          onClick={async () => {
            if (!signalForm.pair || !signalForm.entry || !signalForm.sl || !signalForm.tp1) return
            setSignalSaving(true)
            const s = await createSignal({
              pair: signalForm.pair, entry: signalForm.entry, stopLoss: signalForm.sl,
              takeProfit1: signalForm.tp1, takeProfit2: signalForm.tp2 || undefined,
              takeProfit3: signalForm.tp3 || undefined, direction: signalForm.direction,
              status: "active", notes: signalForm.notes || undefined, postedAt: new Date().toISOString(), result: undefined,
            })
            if (s) { setSignals(prev => [s, ...prev]); setSignalForm({ pair: "", entry: "", sl: "", tp1: "", tp2: "", tp3: "", direction: "BUY", notes: "" }) }
            setSignalSaving(false)
          }}
          disabled={signalSaving || !signalForm.pair || !signalForm.entry || !signalForm.sl || !signalForm.tp1}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {signalSaving ? "Posting..." : "Post Signal"}
        </Button>
      </div>

      {/* Signals list */}
      {newSectionLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading signals...</div>
      ) : signals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No signals posted yet.</div>
      ) : (
        <div className="space-y-3">
          {signals.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.direction === "BUY" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{s.direction}</span>
                <span className="font-bold text-foreground">{s.pair}</span>
                <span className="text-xs text-muted-foreground">Entry: {s.entry} | SL: {s.stopLoss} | TP: {s.takeProfit1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${s.status === "active" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : s.status === "hit_tp" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{s.status}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {s.status === "active" && (
                  <>
                    <button onClick={() => updateSignalStatus(s.id, "hit_tp", "+profit").then(() => setSignals(p => p.map(x => x.id === s.id ? { ...x, status: "hit_tp" as const, result: "+profit" } : x)))} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">TP Hit</button>
                    <button onClick={() => updateSignalStatus(s.id, "hit_sl", "-loss").then(() => setSignals(p => p.map(x => x.id === s.id ? { ...x, status: "hit_sl" as const, result: "-loss" } : x)))} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">SL Hit</button>
                    <button onClick={() => updateSignalStatus(s.id, "cancelled").then(() => setSignals(p => p.map(x => x.id === s.id ? { ...x, status: "cancelled" as const } : x)))} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  </>
                )}
                <button onClick={() => deleteSignal(s.id).then(ok => ok && setSignals(p => p.filter(x => x.id !== s.id)))} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Memberships Manager ───────────────────���───────────────────────────────────
  const renderMemberships = () => {
    const filtered = membershipsData.filter(m =>
      !membershipSearch ||
      m.userName.toLowerCase().includes(membershipSearch.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(membershipSearch.toLowerCase()) ||
      m.plan.toLowerCase().includes(membershipSearch.toLowerCase())
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-foreground">Memberships</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={membershipSearch} onChange={e => setMembershipSearch(e.target.value)} placeholder="Search by name, email, plan..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-48" />
          </div>
        </div>

        {newSectionLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading memberships...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No memberships found.</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["User", "Plan", "Status", "Joined", "Expires", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{m.userName}</p>
                        <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{m.plan}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${m.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/30" : m.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : m.status === "expired" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{m.joinDate ? new Date(m.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {m.status !== "active" && (
                            <button
                              onClick={async () => {
                                const result = await approveMembership(m.id, m.plan)
                                if (result) {
                                  setMembershipsData(p => p.map(x => x.id === m.id
                                    ? { ...x, status: "active" as const, joinDate: result.joinedAt, expiryDate: result.expiresAt }
                                    : x))
                                }
                              }}
                              className="px-2 py-1 rounded text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            >Activate</button>
                          )}
                          {m.status === "active" && (
                            <>
                              <button
                                onClick={async () => {
                                  const exp = m.expiryDate ? new Date(m.expiryDate) : new Date()
                                  exp.setMonth(exp.getMonth() + 1)
                                  await updateMembershipStatus(m.id, "active", exp.toISOString())
                                  setMembershipsData(p => p.map(x => x.id === m.id ? { ...x, expiryDate: exp.toISOString() } : x))
                                }}
                                className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              >+1 Month</button>
                              <button
                                onClick={async () => {
                                  await updateMembershipStatus(m.id, "expired")
                                  setMembershipsData(p => p.map(x => x.id === m.id ? { ...x, status: "expired" as const } : x))
                                }}
                                className="px-2 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              >Expire</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Performance Manager ───────────────────────────────────────���───────────────
  const renderPerformanceManager = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Performance Manager</h2>

      {/* Add/Edit stat form */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-foreground">Add / Update Monthly Stat</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {([
            { key: "month",          label: "Month (YYYY-MM)", ph: "2025-01" },
            { key: "monthLabel",     label: "Label",           ph: "January 2025" },
            { key: "profitPercent",  label: "Profit %",        ph: "18" },
            { key: "winRate",        label: "Win Rate %",      ph: "72" },
            { key: "totalTrades",    label: "Total Trades",    ph: "32" },
            { key: "winningTrades",  label: "Winning",         ph: "23" },
            { key: "losingTrades",   label: "Losing",          ph: "9"  },
          ] as const).map(({ key, label, ph }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground block mb-1">{label}</label>
              <input
                value={(perfForm as Record<string, string>)[key]}
                onChange={e => setPerfForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={ph}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
        <Button
          onClick={async () => {
            if (!perfForm.month || !perfForm.monthLabel) return
            setPerfSaving(true)
            const ok = await upsertPerformanceStat({
              month: perfForm.month, monthLabel: perfForm.monthLabel,
              profitPercent: Number(perfForm.profitPercent) || 0,
              winRate: Number(perfForm.winRate) || 0,
              totalTrades: Number(perfForm.totalTrades) || 0,
              winningTrades: Number(perfForm.winningTrades) || 0,
              losingTrades: Number(perfForm.losingTrades) || 0,
            })
            if (ok) {
              const updated = await getPerformanceStats()
              setPerfStats(updated)
              setPerfForm({ month: "", monthLabel: "", profitPercent: "", winRate: "", totalTrades: "", winningTrades: "", losingTrades: "" })
            }
            setPerfSaving(false)
          }}
          disabled={perfSaving || !perfForm.month || !perfForm.monthLabel}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {perfSaving ? "Saving..." : "Save Stat"}
        </Button>
      </div>

      {/* Stats table */}
      {newSectionLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading stats...</div>
      ) : perfStats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No performance stats yet. Add your first month above.</div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {["Month", "Profit", "Win Rate", "Trades", "W / L"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...perfStats].reverse().map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium text-foreground">{s.monthLabel}</td>
                    <td className={`px-4 py-3 font-bold ${s.profitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>{s.profitPercent >= 0 ? "+" : ""}{s.profitPercent}%</td>
                    <td className="px-4 py-3 text-foreground">{s.winRate}%</td>
                    <td className="px-4 py-3 text-foreground">{s.totalTrades}</td>
                    <td className="px-4 py-3"><span className="text-green-400">{s.winningTrades}W</span> / <span className="text-red-400">{s.losingTrades}L</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  // ── Indicators Manager ──────────────────────────���────────────────────────────
  const INDICATOR_CATEGORIES_ADMIN: IndicatorCategory[] = ["SMC", "ICT", "Liquidity", "Sessions", "Tools", "Price Action"]

  const resetIndicatorForm = () => {
    setIndicatorForm({ name: "", creator: "", category: "SMC", description: "", tradingview_link: "", thumbnail_url: "", is_published: true })
    setIndicatorEditId(null)
    setIndicatorMsg(null)
  }

  const handleSaveIndicator = async () => {
    if (!indicatorForm.name.trim() || !indicatorForm.creator.trim()) return
    setIndicatorSaving(true)
    setIndicatorMsg(null)
    try {
      if (indicatorEditId) {
        const updated = await updateIndicator({ id: indicatorEditId, ...indicatorForm })
        setIndicatorsList(list => list.map(i => i.id === indicatorEditId ? updated : i))
        setIndicatorMsg({ ok: true, text: "Indicator updated." })
      } else {
        const created = await createIndicator(indicatorForm)
        setIndicatorsList(list => [created, ...list])
        setIndicatorMsg({ ok: true, text: "Indicator added." })
      }
      resetIndicatorForm()
    } catch (err) {
      setIndicatorMsg({ ok: false, text: String(err) })
    } finally {
      setIndicatorSaving(false)
    }
  }

  const handleDeleteIndicator = async (id: string) => {
    if (!confirm("Delete this indicator?")) return
    await deleteIndicator(id)
    setIndicatorsList(list => list.filter(i => i.id !== id))
  }

  const handleEditIndicator = (ind: Indicator) => {
    setIndicatorForm({
      name:             ind.name,
      creator:          ind.creator,
      category:         ind.category,
      description:      ind.description ?? "",
      tradingview_link: ind.tradingview_link ?? "",
      thumbnail_url:    ind.thumbnail_url ?? "",
      is_published:     ind.is_published,
    })
    setIndicatorEditId(ind.id)
    setIndicatorMsg(null)
  }

  const handleTogglePublish = async (ind: Indicator) => {
    const updated = await updateIndicator({ id: ind.id, is_published: !ind.is_published })
    setIndicatorsList(list => list.map(i => i.id === ind.id ? updated : i))
  }

  const renderIndicators = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Indicators Manager</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold border border-primary/20">{indicatorsList.length}</span>
      </div>

      {/* Add / Edit form */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">{indicatorEditId ? "Edit Indicator" : "Add New Indicator"}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Name *</label>
            <input value={indicatorForm.name} onChange={e => setIndicatorForm(f => ({ ...f, name: e.target.value }))} placeholder="Order Block Detector" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Creator / Author *</label>
            <input value={indicatorForm.creator} onChange={e => setIndicatorForm(f => ({ ...f, creator: e.target.value }))} placeholder="OG Kaal" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Category</label>
            <select value={indicatorForm.category} onChange={e => setIndicatorForm(f => ({ ...f, category: e.target.value as IndicatorCategory }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary">
              {INDICATOR_CATEGORIES_ADMIN.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">TradingView Link</label>
            <input value={indicatorForm.tradingview_link} onChange={e => setIndicatorForm(f => ({ ...f, tradingview_link: e.target.value }))} placeholder="https://tradingview.com/script/..." className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea rows={2} value={indicatorForm.description} onChange={e => setIndicatorForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground block mb-1">Thumbnail URL (optional)</label>
            <input value={indicatorForm.thumbnail_url} onChange={e => setIndicatorForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIndicatorForm(f => ({ ...f, is_published: !f.is_published }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${indicatorForm.is_published ? "bg-green-500/10 border-green-500/25 text-green-400" : "bg-secondary border-border text-muted-foreground"}`}>
            {indicatorForm.is_published ? "Published" : "Draft"}
          </button>
          <div className="flex-1" />
          {indicatorEditId && (
            <button onClick={resetIndicatorForm} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Cancel</button>
          )}
          <Button onClick={handleSaveIndicator} disabled={indicatorSaving || !indicatorForm.name.trim() || !indicatorForm.creator.trim()} size="sm">
            {indicatorSaving ? "Saving..." : indicatorEditId ? "Update" : "Add Indicator"}
          </Button>
        </div>

        {indicatorMsg && (
          <p className={`text-xs ${indicatorMsg.ok ? "text-green-400" : "text-red-400"}`}>{indicatorMsg.text}</p>
        )}
      </div>

      {/* List */}
      {indicatorsLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading indicators...</div>
      ) : indicatorsList.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-xl">No indicators yet. Add one above.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["Name", "Creator", "Category", "TV Link", "Published", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicatorsList.map(ind => (
                <tr key={ind.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4 text-xs font-medium text-foreground">{ind.name}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{ind.creator}</td>
                  <td className="py-3 px-4"><span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">{ind.category}</span></td>
                  <td className="py-3 px-4">
                    {ind.tradingview_link
                      ? <a href={ind.tradingview_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Link</a>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleTogglePublish(ind)} className={`text-xs px-2 py-0.5 rounded-full border font-semibold transition-colors ${ind.is_published ? "bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20" : "bg-secondary border-border text-muted-foreground hover:bg-secondary/60"}`}>
                      {ind.is_published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditIndicator(ind)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Edit"><Settings className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteIndicator(ind.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // ── Shared submission table renderer ────────────────────────────────────────
  const renderSubmissionSection = (
    title: string,
    icon: React.ReactNode,
    rows: Submission[],
    sectionKey: Section,
  ) => {
    const unread = unreadBySection[sectionKey] ?? 0
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {unread > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/30">
                {unread} New
              </span>
            )}
          </div>
          <button
            onClick={() => loadData({ spinning: true })}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["User ID", "Name", "Email", "Phone", "Telegram", "Amount / Details", "Date", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">No {title.toLowerCase()} yet</td></tr>
                  : rows.map((s, i) => {
                    const detailStr = s.amount
                      ? s.amount
                      : s.details && typeof s.details === "object"
                        ? Object.entries(s.details as Record<string, unknown>)
                            .filter(([k]) => ["program","plan","cardType","action","amount","accountSize"].includes(k))
                            .map(([, v]) => String(v))
                            .join(" · ")
                        : "—"
                    return (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{s.userId || uid(i)}</td>
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                          <button onClick={() => { setDetailView(s); markSubmissionNotifRead(s) }} className="hover:text-primary hover:underline">{s.name}</button>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{s.email || "—"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{s.phone || "—"}</td>
                        <td className="py-3 px-4 text-xs text-foreground">{s.telegram || "—"}</td>
                        <td className="py-3 px-4 text-xs text-foreground max-w-[140px] truncate" title={detailStr}>{detailStr || "—"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setDetailView(s); markSubmissionNotifRead(s) }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></button>
                            {s.status === "pending" && (
                              <>
                                <button onClick={() => updateStatus(s.id, "approved")} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => updateStatus(s.id, "rejected")} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Reject"><Ban className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderMentorshipRequests = () => {
    const rows = submissions.filter(s => s.type === "mentorship")
    return renderSubmissionSection(
      "Mentorship Requests",
      <FileText className="w-5 h-5 text-blue-400" />,
      rows,
      "mentorship-requests",
    )
  }

  const renderVipRequests = () => {
    const rows = submissions.filter(s => s.type === "vip" || s.type === "vip_group")
    return renderSubmissionSection(
      "VIP Group Requests",
      <Crown className="w-5 h-5 text-primary" />,
      rows,
      "vip-requests",
    )
  }

  const renderUserProfiles = () => {
    const rows = submissions.filter(s => s.type === "member" || s.type === "other")
    return renderSubmissionSection(
      "User Profiles",
      <Users className="w-5 h-5 text-green-400" />,
      rows,
      "user-profiles",
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":            return renderDashboard()
      case "payment-verification": return renderPaymentVerification()
      case "usdt-buy":             return renderUSDTBuy()
      case "usdt-sell":            return renderUSDTSell()
      case "mentorship-requests":  return renderMentorshipRequests()
      case "vip-requests":         return renderVipRequests()
      case "user-profiles":        return renderUserProfiles()
      case "suspicious":           return renderSuspicious()
      case "members":              return renderMembers()
      case "notifications":        return renderNotifications()
      case "files":                return renderFiles()
      case "export":               return renderExport()
      case "system-control":       return renderSystemControl()
      case "telegram":             return renderTelegram()
      case "security":             return renderSecurity()
      case "logs":                 return renderLogs()
      case "signals":              return renderSignals()
      case "memberships":          return renderMemberships()
      case "performance":          return renderPerformanceManager()
      case "indicators":           return renderIndicators()
      case "analytics":            return renderAnalytics()
      case "data":                 return <AdminDataManagement />
      default:                     return renderDashboard()
    }
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col h-full shrink-0">
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
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        <header className="shrink-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-foreground truncate capitalize">
              {activeSection.replace(/-/g, " ")}
            </span>
          </div>
        </header>

        <main className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
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
