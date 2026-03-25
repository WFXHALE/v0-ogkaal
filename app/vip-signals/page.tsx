"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSession } from "@/lib/community-utils"
import type { VipSignal } from "@/lib/membership-store"
import {
  Crown, TrendingUp, TrendingDown, CheckCircle, XCircle,
  Clock, AlertCircle, Lock, RefreshCw,
} from "lucide-react"
import Link from "next/link"

function SignalCard({ signal }: { signal: VipSignal }) {
  const isBuy = signal.direction === "BUY"
  const isActive = signal.status === "active"

  const statusEl = {
    active:     <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400"><Clock className="w-3 h-3" />Active</span>,
    hit_tp:     <span className="flex items-center gap-1.5 text-xs font-bold text-green-400"><CheckCircle className="w-3 h-3" />TP Hit</span>,
    hit_sl:     <span className="flex items-center gap-1.5 text-xs font-bold text-red-400"><XCircle className="w-3 h-3" />SL Hit</span>,
    cancelled:  <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><XCircle className="w-3 h-3" />Cancelled</span>,
  }[signal.status]

  return (
    <div className={`rounded-2xl border bg-card p-5 space-y-4 ${isActive ? "border-[#FCD535]/30" : "border-border"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isBuy ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
            {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{signal.pair}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isBuy ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              {signal.direction}
            </span>
          </div>
        </div>
        {statusEl}
      </div>

      {/* Price levels */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Entry</p>
          <p className="text-sm font-bold text-foreground">{signal.entry}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
          <p className="text-sm font-bold text-red-400">{signal.stopLoss}</p>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
          <p className="text-sm font-bold text-green-400">{signal.takeProfit}</p>
        </div>
      </div>

      {/* Notes & result */}
      {signal.notes && (
        <p className="text-sm text-muted-foreground border-t border-border pt-3">{signal.notes}</p>
      )}
      {signal.result && (
        <div className={`px-3 py-2 rounded-lg text-sm font-semibold border ${signal.status === "hit_tp" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          Result: {signal.result}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground pt-1">
        {new Date(signal.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  )
}

export default function VipSignalsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signals, setSignals] = useState<VipSignal[]>([])
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const check = async () => {
      const user = getSession()
      if (!user) { router.replace("/community"); return }

      // Use server-side API routes — never call Supabase client directly from browser
      const memRes = await fetch(
        `/api/memberships/check?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`,
      ).then(r => r.json()).catch(() => ({ ok: false, membership: null }))

      const m = memRes.membership as { status: string; plan: string } | null
      const canAccess = m?.status === "active" && (m.plan === "VIP" || m.plan === "VIP Group")
      setAuthorized(canAccess)

      if (canAccess) {
        const sigRes = await fetch("/api/admin/signals").then(r => r.json()).catch(() => ({ ok: false }))
        if (sigRes.ok) setSignals(sigRes.data ?? [])
      }
      setLoading(false)
    }
    check()
  }, [router])

  const refresh = async () => {
    setRefreshing(true)
    const sigRes = await fetch("/api/admin/signals").then(r => r.json()).catch(() => ({ ok: false }))
    if (sigRes.ok) setSignals(sigRes.data ?? [])
    setRefreshing(false)
  }

  const filtered = signals.filter(s => {
    if (filter === "active") return s.status === "active"
    if (filter === "closed") return s.status !== "active"
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FCD535] border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6 py-20">
            <div className="w-20 h-20 rounded-3xl bg-[#FCD535]/10 border border-[#FCD535]/30 flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-[#FCD535]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">VIP Access Required</h1>
              <p className="text-muted-foreground">VIP trading signals are exclusively available to active VIP and VIP Group members.</p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/vip-group" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FCD535] text-black font-bold text-sm hover:bg-[#FCD535]/90 transition-colors">
                <Crown className="w-4 h-4" />
                Get VIP Access
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors">
                My Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const activeCount = signals.filter(s => s.status === "active").length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Crown className="w-6 h-6 text-[#FCD535]" />
              <h1 className="text-2xl font-bold text-foreground">VIP Signals</h1>
              {activeCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FCD535]/10 text-[#FCD535] border border-[#FCD535]/30">
                  {activeCount} Active
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">Exclusive trade alerts for VIP members</p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "active", "closed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${filter === f ? "bg-[#FCD535] text-black" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No signals yet</p>
            <p className="text-sm text-muted-foreground">New trade alerts will appear here when posted by the admin.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(s => <SignalCard key={s.id} signal={s} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
