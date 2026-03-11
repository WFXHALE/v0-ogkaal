"use client"

import { useState, useEffect, useRef } from "react"
import {
  Bell, X, CheckCheck, Megaphone, GraduationCap, Tag,
  ShieldCheck, ArrowLeftRight, Users, TrendingUp, Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export type PushNotifType =
  | "announcement" | "mentorship" | "discount" | "kyc"
  | "usdt_p2p"     | "community"  | "trading_alert"

export interface PushNotification {
  id: string
  type: PushNotifType
  title: string
  body: string
  read: boolean
  created_at: string
  data?: Record<string, string>
}

const TYPE_META: Record<PushNotifType, { icon: React.ElementType; color: string }> = {
  announcement:  { icon: Megaphone,      color: "text-primary"     },
  mentorship:    { icon: GraduationCap,  color: "text-blue-400"    },
  discount:      { icon: Tag,            color: "text-emerald-400" },
  kyc:           { icon: ShieldCheck,    color: "text-amber-400"   },
  usdt_p2p:      { icon: ArrowLeftRight, color: "text-violet-400"  },
  community:     { icon: Users,          color: "text-pink-400"    },
  trading_alert: { icon: TrendingUp,     color: "text-cyan-400"    },
}

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function PushNotificationBell({ userId }: { userId: string }) {
  const [open, setOpen]       = useState(false)
  const [items, setItems]     = useState<PushNotification[]>([])
  const [loading, setLoading] = useState(true)
  const panelRef              = useRef<HTMLDivElement>(null)
  const supabase              = createClient()
  const unread                = items.filter(n => !n.read).length

  // Initial fetch
  useEffect(() => {
    if (!userId) return
    supabase
      .from("push_notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        setItems((data as PushNotification[]) ?? [])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Real-time subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`push_notifs_${userId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "push_notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setItems(prev => [payload.new as PushNotification, ...prev])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markAllRead = async () => {
    await supabase
      .from("push_notifications")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("read", false)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = async (id: string) => {
    if (items.find(n => n.id === id)?.read) return
    await supabase.from("push_notifications").update({ read: true }).eq("id", id)
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Push notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <span className="font-semibold text-sm text-foreground">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-xs">No notifications yet</p>
                <p className="text-[10px] opacity-60">Platform updates will appear here</p>
              </div>
            ) : (
              items.map(n => {
                const meta = TYPE_META[n.type] ?? TYPE_META.announcement
                const Icon = meta.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-xl flex items-center justify-center bg-secondary/50 ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
