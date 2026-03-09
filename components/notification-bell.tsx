"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Heart, MessageCircle, UserPlus, Megaphone, Check } from "lucide-react"
import { timeAgo } from "@/lib/community-store"

export type NotificationType = "like" | "comment" | "follow" | "admin_post"

export interface Notification {
  id: string
  type: NotificationType
  recipient_id: string
  actor_id: string
  actor_name: string
  actor_avatar: string
  post_id: string | null
  post_preview: string | null
  is_read: boolean
  created_at: string
}

const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string; label: string }> = {
  like:       { icon: Heart,         color: "text-red-400",    label: "liked your post" },
  comment:    { icon: MessageCircle, color: "text-blue-400",   label: "commented on your post" },
  follow:     { icon: UserPlus,      color: "text-green-400",  label: "started following you" },
  admin_post: { icon: Megaphone,     color: "text-[#FCD535]",  label: "posted a new update" },
}

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}&limit=30`)
  if (!res.ok) return []
  const { data } = await res.json()
  return data ?? []
}

async function markAllRead(userId: string) {
  await fetch("/api/notifications/read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
}

interface Props {
  userId: string
}

export function NotificationBell({ userId }: Props) {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchNotifications(userId)
    setNotifications(data)
    setLoading(false)
  }, [userId])

  // Initial load + 30s polling
  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load])

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  async function handleOpen() {
    const wasOpen = open
    setOpen((v) => !v)
    if (!wasOpen && unreadCount > 0) {
      // Optimistically mark all read in UI
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      await markAllRead(userId)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#FCD535] text-[#0B0E11] text-[10px] font-bold px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] flex flex-col rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {notifications.some((n) => n.is_read) && (
              <span className="text-xs text-muted-foreground">All caught up</span>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Activity from your community will appear here</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.like
                const Icon = meta.icon
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors ${n.is_read ? "" : "bg-[#FCD535]/[0.04]"}`}
                  >
                    {/* Avatar + type icon */}
                    <div className="relative shrink-0">
                      <img
                        src={n.actor_avatar}
                        alt={n.actor_name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-card border border-border ${meta.color}`}>
                        <Icon className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">
                        <span className="font-semibold">{n.actor_name}</span>
                        {" "}{meta.label}
                      </p>
                      {n.post_preview && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          "{n.post_preview}"
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#FCD535] shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={async () => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
                  await markAllRead(userId)
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---- helper to fire a notification ------------------------------------------

export async function sendNotification(payload: {
  type: NotificationType
  recipientId: string
  actorId: string
  actorName: string
  actorAvatar: string
  postId?: string
  postPreview?: string
}) {
  if (payload.recipientId === payload.actorId) return // never self-notify
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:         payload.type,
        recipient_id: payload.recipientId,
        actor_id:     payload.actorId,
        actor_name:   payload.actorName,
        actor_avatar: payload.actorAvatar,
        post_id:      payload.postId,
        post_preview: payload.postPreview,
      }),
    })
  } catch {
    // fire-and-forget — don't block UI on failure
  }
}
