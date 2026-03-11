import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: totalMembers },
      { count: activeMembers },
      { count: pendingPayments },
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
      supabase.from("dashboard_users").select("*", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from("dashboard_users")
        .select("user_id, full_name, email, created_at, is_verified")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("site_visitors")
        .select("date, count")
        .order("date", { ascending: false })
        .limit(14),
      supabase.from("memberships")
        .select("plan, status")
        .limit(500),
    ])

    // Aggregate visitor counts by date
    const visitorsByDate: Record<string, number> = {}
    for (const row of (visitorRows ?? [])) {
      visitorsByDate[row.date] = (visitorsByDate[row.date] ?? 0) + Number(row.count ?? 0)
    }
    const visitors14d = Object.entries(visitorsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    // Membership breakdown
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
        pendingPayments: pendingPayments ?? 0,
        todaySignups:    todaySignups    ?? 0,
      },
      recentSignups:      recentSignups     ?? [],
      visitors14d,
      planBreakdown: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
