import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayIso        = todayStart.toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel — only against tables confirmed to exist in the DB
    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: totalMembers },
      { count: activeMembers },
      { count: todaySignups },
      { data: recentSignups },
      { data: visitorRows },
      { data: membershipBreakdown },
    ] = await Promise.all([
      supabase.from("dashboard_users").select("*", { count: "exact", head: true }),
      supabase.from("dashboard_users").select("*", { count: "exact", head: true }).eq("is_verified", true),
      supabase.from("memberships").select("*", { count: "exact", head: true }),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("dashboard_users").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("dashboard_users")
        .select("user_id, full_name, email, created_at, is_verified")
        .order("created_at", { ascending: false })
        .limit(10),
      // site_visitors has created_at — group by date in JS
      supabase.from("site_visitors")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true }),
      supabase.from("memberships")
        .select("plan, status")
        .limit(500),
    ])

    // Aggregate visitor page-views by calendar date
    const visitorsByDate: Record<string, number> = {}
    for (const row of (visitorRows ?? [])) {
      const date = String(row.created_at ?? "").slice(0, 10)
      if (date) visitorsByDate[date] = (visitorsByDate[date] ?? 0) + 1
    }

    // Build a full 14-day window filling in zeroes for missing days
    const visitors14d: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      visitors14d.push({ date: key, count: visitorsByDate[key] ?? 0 })
    }

    // Total site visits in window
    const totalVisits14d = visitors14d.reduce((s, v) => s + v.count, 0)

    // Membership plan breakdown (active only)
    const planCounts: Record<string, number> = {}
    for (const m of (membershipBreakdown ?? [])) {
      if (m.status === "active") {
        planCounts[m.plan] = (planCounts[m.plan] ?? 0) + 1
      }
    }

    // Signups trend — last 14 days from dashboard_users
    const { data: signupRows } = await supabase
      .from("dashboard_users")
      .select("created_at")
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: true })

    const signupsByDate: Record<string, number> = {}
    for (const row of (signupRows ?? [])) {
      const date = String(row.created_at ?? "").slice(0, 10)
      if (date) signupsByDate[date] = (signupsByDate[date] ?? 0) + 1
    }
    const signups14d = visitors14d.map(v => ({
      date: v.date,
      count: signupsByDate[v.date] ?? 0,
    }))

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers:     totalUsers     ?? 0,
        verifiedUsers:  verifiedUsers  ?? 0,
        totalMembers:   totalMembers   ?? 0,
        activeMembers:  activeMembers  ?? 0,
        todaySignups:   todaySignups   ?? 0,
        totalVisits14d,
      },
      recentSignups:  recentSignups ?? [],
      visitors14d,
      signups14d,
      planBreakdown: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
