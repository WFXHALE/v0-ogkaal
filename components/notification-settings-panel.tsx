"use client"

import { useState, useEffect } from "react"
import {
  Bell, BellOff, Megaphone, GraduationCap, Tag, ShieldCheck,
  ArrowLeftRight, Users, TrendingUp, Loader2, CheckCircle,
} from "lucide-react"

type CategoryKey = "announcements" | "mentorship" | "discounts" | "kyc" | "usdt_p2p" | "community" | "trading_alerts"

interface Settings {
  announcements:  boolean
  mentorship:     boolean
  discounts:      boolean
  kyc:            boolean
  usdt_p2p:       boolean
  community:      boolean
  trading_alerts: boolean
}

interface CategoryConfig {
  label:       string
  description: string
  icon:        React.ElementType
  color:       string
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  announcements:  { label: "Platform Announcements",  description: "Important updates and news from OGKaal",      icon: Megaphone,      color: "text-primary"     },
  mentorship:     { label: "Mentorship Updates",       description: "Session schedules, materials, and approvals", icon: GraduationCap,  color: "text-blue-400"    },
  discounts:      { label: "Discount & Offers",        description: "Exclusive deals, flash sales, promo codes",   icon: Tag,            color: "text-emerald-400" },
  kyc:            { label: "KYC Verification",         description: "Status updates on your identity verification",icon: ShieldCheck,    color: "text-amber-400"   },
  usdt_p2p:       { label: "USDT P2P Orders",          description: "Order placed, payment confirmed, released",   icon: ArrowLeftRight, color: "text-violet-400"  },
  community:      { label: "Community Activity",       description: "Replies and interactions on your posts",      icon: Users,          color: "text-pink-400"    },
  trading_alerts: { label: "Trading Alerts",           description: "Session starts and market alerts (optional)", icon: TrendingUp,     color: "text-cyan-400"    },
}

const DEFAULT_SETTINGS: Settings = {
  announcements:  true,
  mentorship:     true,
  discounts:      true,
  kyc:            true,
  usdt_p2p:       true,
  community:      true,
  trading_alerts: false,
}

export function NotificationSettingsPanel({ userId }: { userId: string }) {
  const [settings,     setSettings]     = useState<Settings>(DEFAULT_SETTINGS)
  const [pushEnabled,  setPushEnabled]  = useState(true)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  // Fetch current settings
  useEffect(() => {
    if (!userId) return
    fetch(`/api/dashboard/notification-settings?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(({ settings: s, push_enabled }) => {
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...s })
        if (push_enabled !== undefined) setPushEnabled(push_enabled)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  const save = async (newSettings: Settings, newPushEnabled: boolean) => {
    setSaving(true)
    setSaved(false)
    await fetch("/api/dashboard/notification-settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, settings: newSettings, push_enabled: newPushEnabled }),
    }).catch(() => {})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggle = (key: CategoryKey) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    save(updated, pushEnabled)
  }

  const togglePush = () => {
    const updated = !pushEnabled
    setPushEnabled(updated)
    save(settings, updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Master push toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${pushEnabled ? "bg-primary/10" : "bg-secondary"}`}>
            {pushEnabled
              ? <Bell className="w-4 h-4 text-primary" />
              : <BellOff className="w-4 h-4 text-muted-foreground" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Push Notifications</p>
            <p className="text-xs text-muted-foreground">Enable or disable all push notifications</p>
          </div>
        </div>
        <button
          onClick={togglePush}
          disabled={saving}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${pushEnabled ? "bg-primary" : "bg-secondary border border-border"}`}
          aria-checked={pushEnabled}
          role="switch"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pushEnabled ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Category toggles */}
      <div className={`rounded-xl border border-border overflow-hidden transition-opacity ${!pushEnabled ? "opacity-40 pointer-events-none" : ""}`}>
        {(Object.entries(CATEGORIES) as [CategoryKey, CategoryConfig][]).map(([key, cfg], i, arr) => {
          const Icon = cfg.icon
          const on   = settings[key]
          return (
            <div
              key={key}
              className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border/60" : ""} hover:bg-secondary/20 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-secondary/50 ${cfg.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(key)}
                disabled={saving}
                className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors shrink-0 ml-4 ${on ? "bg-primary" : "bg-secondary border border-border"}`}
                aria-checked={on}
                role="switch"
              >
                <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0"}`} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Save confirmation */}
      {saved && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" /> Settings saved
        </div>
      )}
    </div>
  )
}
