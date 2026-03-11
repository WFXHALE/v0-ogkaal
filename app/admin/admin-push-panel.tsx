"use client"

import { useState } from "react"
import {
  Send, Megaphone, GraduationCap, Tag, ShieldCheck,
  ArrowLeftRight, Users, TrendingUp, CheckCircle, AlertCircle,
  Loader2, ChevronDown,
} from "lucide-react"

type NotifType = "announcement" | "mentorship" | "discount" | "kyc" | "usdt_p2p" | "community" | "trading_alert"
type Target    = "all" | "user"

interface TypeConfig {
  label:       string
  icon:        React.ElementType
  color:       string
  description: string
  templates:   { title: string; body: string }[]
}

const TYPE_CONFIG: Record<NotifType, TypeConfig> = {
  announcement: {
    label: "Platform Announcement", icon: Megaphone, color: "text-primary",
    description: "Broadcast to all users",
    templates: [
      { title: "Platform Update", body: "We've launched new features! Check your dashboard for the latest improvements." },
      { title: "Maintenance Notice", body: "Scheduled maintenance on Saturday 2AM–4AM IST. Services may be briefly unavailable." },
      { title: "Important Notice", body: "Please review our updated terms of service effective from next week." },
    ],
  },
  mentorship: {
    label: "Mentorship Update", icon: GraduationCap, color: "text-blue-400",
    description: "Target a specific user or broadcast",
    templates: [
      { title: "Session Scheduled", body: "Your mentorship session has been scheduled. Check your calendar for details." },
      { title: "Material Released", body: "New mentorship material is available in your dashboard. Start learning now!" },
      { title: "Mentorship Approved", body: "Congratulations! Your mentorship enrollment has been approved." },
    ],
  },
  discount: {
    label: "Discount Announcement", icon: Tag, color: "text-emerald-400",
    description: "Broadcast to all users",
    templates: [
      { title: "Limited Time Offer", body: "Get 20% off on VIP membership this weekend only. Use code OGVIP20 at checkout." },
      { title: "Flash Sale Live", body: "24-hour flash sale is live! Grab your VIP access at the best price." },
      { title: "Exclusive Discount", body: "Special discount available for existing members. Upgrade your plan today." },
    ],
  },
  kyc: {
    label: "KYC Verification Result", icon: ShieldCheck, color: "text-amber-400",
    description: "Target a specific user",
    templates: [
      { title: "KYC Approved", body: "Your identity verification has been approved. You now have full platform access." },
      { title: "KYC Rejected", body: "Your KYC submission was rejected. Please resubmit with clearer documents." },
      { title: "KYC Pending Review", body: "Your KYC documents are under review. This typically takes 24–48 hours." },
    ],
  },
  usdt_p2p: {
    label: "USDT P2P Order Update", icon: ArrowLeftRight, color: "text-violet-400",
    description: "Target a specific user",
    templates: [
      { title: "Order Placed", body: "Your USDT P2P order has been placed and is awaiting confirmation." },
      { title: "Payment Confirmed", body: "Payment received! Your USDT is being processed for release." },
      { title: "Order Completed", body: "Your USDT P2P order has been completed. Funds have been released." },
    ],
  },
  community: {
    label: "Community Activity", icon: Users, color: "text-pink-400",
    description: "Target a specific user",
    templates: [
      { title: "New Reply", body: "Someone replied to your post in the community forum. Check it out!" },
      { title: "Post Liked", body: "Your post is getting attention in the community!" },
      { title: "New Post Alert", body: "There is new activity in the community. Join the discussion!" },
    ],
  },
  trading_alert: {
    label: "Trading Alert", icon: TrendingUp, color: "text-cyan-400",
    description: "Broadcast to opted-in users",
    templates: [
      { title: "Session Opening", body: "London trading session is now open. High volatility expected on EUR/USD." },
      { title: "Market Alert", body: "Major news event in 30 minutes. Exercise caution with open positions." },
      { title: "Session Closing", body: "New York session closing soon. Review and manage your open positions." },
    ],
  },
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ""

export function AdminPushPanel() {
  const [selectedType, setSelectedType] = useState<NotifType>("announcement")
  const [target,       setTarget]       = useState<Target>("all")
  const [userId,       setUserId]       = useState("")
  const [title,        setTitle]        = useState("")
  const [body,         setBody]         = useState("")
  const [sending,      setSending]      = useState(false)
  const [result,       setResult]       = useState<{ ok: boolean; msg: string } | null>(null)

  const cfg = TYPE_CONFIG[selectedType]

  const applyTemplate = (t: { title: string; body: string }) => {
    setTitle(t.title)
    setBody(t.body)
    setResult(null)
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ ok: false, msg: "Title and message are required." })
      return
    }
    if (target === "user" && !userId.trim()) {
      setResult({ ok: false, msg: "User ID is required for targeted notifications." })
      return
    }
    setSending(true)
    setResult(null)
    try {
      const payload: Record<string, unknown> = { title: title.trim(), body: body.trim(), type: selectedType }
      if (target === "user") payload.user_id = userId.trim()

      const res = await fetch("/api/admin/send-push", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setResult({ ok: false, msg: j.error ?? "Failed to send notification." })
      } else {
        setResult({ ok: true, msg: target === "all" ? "Broadcast sent to all users!" : `Notification sent to user ${userId}.` })
        setTitle(""); setBody(""); setUserId("")
      }
    } catch {
      setResult({ ok: false, msg: "Network error. Please try again." })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Send className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Push Broadcast</h3>
          <p className="text-xs text-muted-foreground">Send real-time notifications to users</p>
        </div>
      </div>

      {/* Type selector */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Notification Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(Object.entries(TYPE_CONFIG) as [NotifType, TypeConfig][]).map(([key, c]) => {
            const Icon = c.icon
            return (
              <button
                key={key}
                onClick={() => { setSelectedType(key); setResult(null) }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-colors ${selectedType === key ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${selectedType === key ? c.color : ""}`} />
                <span className="truncate">{c.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — compose */}
        <div className="space-y-4">
          {/* Target */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Target Audience</label>
            <div className="flex gap-2">
              {(["all", "user"] as Target[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${target === t ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "all" ? "All Users (Broadcast)" : "Specific User"}
                </button>
              ))}
            </div>
          </div>

          {/* User ID (targeted only) */}
          {target === "user" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">User ID</label>
              <input
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="e.g. USER-0001 or UUID"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Notification Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short and clear title"
              maxLength={80}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/80</p>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Notification message body..."
              rows={4}
              maxLength={300}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{body.length}/300</p>
          </div>

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs border ${result.ok ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              {result.ok ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {result.msg}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : target === "all" ? "Broadcast to All Users" : "Send to User"}
          </button>
        </div>

        {/* Right — templates + preview */}
        <div className="space-y-4">
          {/* Templates */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Quick Templates <span className="normal-case font-normal">(click to apply)</span>
            </label>
            <div className="space-y-2">
              {cfg.templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{t.title}</p>
                    <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0 -rotate-90" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t.body}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {(title || body) && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Preview</label>
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-start gap-2">
                  <div className={`w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                    <cfg.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{title || "Notification Title"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{body || "Your message will appear here..."}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
