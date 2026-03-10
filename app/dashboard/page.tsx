"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getSession } from "@/lib/community-utils"
import { getMembershipByEmail, getMembershipByUserId } from "@/lib/membership-store"
import type { Membership } from "@/lib/membership-store"
import {
  User, Crown, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, CreditCard, LogOut, ArrowRight, Shield, TrendingUp,
} from "lucide-react"
import { setSession } from "@/lib/community-utils"

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30"><CheckCircle className="w-3 h-3" />Active</span>
  if (status === "pending")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"><Clock className="w-3 h-3" />Pending Verification</span>
  if (status === "expired")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30"><XCircle className="w-3 h-3" />Expired</span>
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary text-muted-foreground border border-border"><AlertCircle className="w-3 h-3" />No Plan</span>
}

function PlanIcon({ plan }: { plan: string }) {
  if (plan === "VIP" || plan === "VIP Group") return <Crown className="w-5 h-5 text-[#FCD535]" />
  if (plan === "Mentorship") return <Shield className="w-5 h-5 text-blue-400" />
  return <User className="w-5 h-5 text-muted-foreground" />
}

function formatDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function daysLeft(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const diff = new Date(expiryDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(getSession())
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getSession()
    if (!u) { router.replace("/community"); return }
    setUser(u)
    // Try by userId first, fall back to email
    const load = async () => {
      let m = await getMembershipByUserId(u.id)
      if (!m) m = await getMembershipByEmail(u.email)
      setMembership(m)
      setLoading(false)
    }
    load()
  }, [router])

  function handleLogout() {
    setSession(null)
    router.push("/")
  }

  if (!user) return null

  const days = membership ? daysLeft(membership.expiryDate) : null
  const isActive = membership?.status === "active"
  const hasVip = isActive && (membership?.plan === "VIP" || membership?.plan === "VIP Group")
  const hasMentorship = isActive && membership?.plan === "Mentorship"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Welcome back, {user.fullName.split(" ")[0]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-5">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-2xl border-2 border-[#FCD535]/40"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{user.fullName}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Member since {formatDate(user.createdAt)}</p>
              </div>
              <div className="shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCD535]/10 text-[#FCD535] border border-[#FCD535]/30">
                  {user.level}
                </span>
              </div>
            </div>

            {/* Membership Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Membership</h2>
              {membership ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <PlanIcon plan={membership.plan} />
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
                      <p className="text-sm font-semibold text-foreground">{formatDate(membership.expiryDate)}</p>
                    </div>
                  </div>
                  {days !== null && days > 0 && days <= 30 && (
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                      <p className="text-sm text-yellow-300">Your membership expires in <strong>{days} days</strong>. Renew to keep access.</p>
                    </div>
                  )}
                  {membership.status === "expired" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-300">Your membership has expired. Renew to restore access.</p>
                    </div>
                  )}
                  {membership.status === "pending" && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-sm text-blue-300">Payment is under review. You will be added once verified.</p>
                    </div>
                  )}
                  {membership.amountPaid && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                      <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Amount Paid</p>
                        <p className="text-sm font-semibold text-foreground">{membership.amountPaid}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/50 mx-auto flex items-center justify-center">
                    <Crown className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">No Active Plan</p>
                    <p className="text-sm text-muted-foreground mt-1">You don't have an active membership yet.</p>
                  </div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/vip-group" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FCD535] text-black font-semibold text-sm hover:bg-[#FCD535]/90 transition-colors">
                      <Crown className="w-4 h-4" />
                      Get VIP Access
                    </Link>
                    <Link href="/mentorship" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors">
                      <Shield className="w-4 h-4" />
                      Mentorship
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {hasVip && (
                <Link href="/vip-signals" className="group p-5 rounded-2xl border border-[#FCD535]/30 bg-[#FCD535]/5 hover:bg-[#FCD535]/10 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FCD535]/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-[#FCD535]" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">VIP Signals</p>
                      <p className="text-xs text-muted-foreground">Live trade alerts</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}
              <Link href="/performance" className="group p-5 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Performance</p>
                    <p className="text-xs text-muted-foreground">Monthly stats</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
              {hasMentorship && (
                <Link href="/community" className="group p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Community</p>
                      <p className="text-xs text-muted-foreground">Mentorship group</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}
              {!hasVip && !hasMentorship && (
                <Link href="/vip-group" className="group p-5 rounded-2xl border border-dashed border-border bg-card hover:bg-secondary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Crown className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground">Upgrade Plan</p>
                      <p className="text-xs text-muted-foreground">Get VIP or Mentorship</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
