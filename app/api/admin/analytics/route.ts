import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Date boundaries
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayIso       = todayStart.toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: totalMembers },
      { count: activeMembers },
      { count: pendingSubmissions },
      { count: pendingUsdtBuy },
      { count: pendingUsdtSell },
      { count: todaySignups },
      { data: recentSignups },
      { data: visitorRows },
      { data: membershipBreakdown },
    ] = await Promise.all([
      supabase.from("dashboard_users").select("*", { count: "exact", head: true }),
      supabase.from("dashboard_users").select("*", { count: "exact", head: true }).eq("is_verified", true),
      supabase.from("memberships").select("*", { count: "exact", head: true }),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("admin_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("usdt_buy_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("usdt_sell_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("dashboard_users").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("dashboard_users")
        .select("user_id, full_name, email, created_at, is_verified")
        .order("created_at", { ascending: false })
        .limit(10),
      // site_visitors uses created_at — aggregate by date in JS
      supabase.from("site_visitors")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true }),
      supabase.from("memberships")
        .select("plan, status")
        .limit(500),
    ])

    // Total pending payments across submissions + USDT orders
    const pendingPayments = (pendingSubmissions ?? 0) + (pendingUsdtBuy ?? 0) + (pendingUsdtSell ?? 0)

    // Aggregate visitor counts by calendar date (YYYY-MM-DD)
    const visitorsByDate: Record<string, number> = {}
    for (const row of (visitorRows ?? [])) {
      const date = String(row.created_at ?? "").slice(0, 10)
      if (date) visitorsByDate[date] = (visitorsByDate[date] ?? 0) + 1
    }
    const visitors14d = Object.entries(visitorsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }))

    // Membership breakdown by plan (active only)
    const planCounts: Record<string, number> = {}
    for (const m of (membershipBreakdown ?? [])) {
      if (m.status === "active") {
        planCounts[m.plan] = (planCounts[m.plan] ?? 0) + 1
      }
    }

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers:      totalUsers      ?? 0,
        verifiedUsers:   verifiedUsers   ?? 0,
        totalMembers:    totalMembers    ?? 0,
        activeMembers:   activeMembers   ?? 0,
        pendingPayments,
        todaySignups:    todaySignups    ?? 0,
      },
      recentSignups:  recentSignups ?? [],
      visitors14d,
      planBreakdown:  Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
