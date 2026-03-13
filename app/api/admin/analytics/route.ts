import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const todayStart      = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayIso        = todayStart.toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // All counts in a single round-trip using a multi-column aggregate query
    const [counts] = await query<{
      total_users:       string
      verified_users:    string
      today_signups:     string
      total_vip:         string
      total_mentorship:  string
      total_usdt_buy:    string
      total_usdt_sell:   string
    }>(`
      SELECT
        (SELECT COUNT(*) FROM dashboard_users)                                               AS total_users,
        (SELECT COUNT(*) FROM dashboard_users WHERE is_verified = true)                      AS verified_users,
        (SELECT COUNT(*) FROM dashboard_users WHERE created_at >= $1)                        AS today_signups,
        (SELECT COUNT(*) FROM admin_submissions WHERE type ILIKE '%vip%')                    AS total_vip,
        (SELECT COUNT(*) FROM admin_submissions WHERE type = 'mentorship')                   AS total_mentorship,
        (SELECT COUNT(*) FROM usdt_buy_requests)                                             AS total_usdt_buy,
        (SELECT COUNT(*) FROM usdt_sell_requests)                                            AS total_usdt_sell
    `, [todayIso])

    // Recent signups
    const recentSignups = await query(
      `SELECT user_id, full_name, email, created_at, is_verified
         FROM dashboard_users ORDER BY created_at DESC LIMIT 10`,
    )

    // Site visits in 14-day window
    const visitorRows = await query<{ created_at: string }>(
      `SELECT created_at FROM site_visitors WHERE created_at >= $1 ORDER BY created_at ASC`,
      [fourteenDaysAgo],
    )

    // Signup trend in 14-day window
    const signupRows = await query<{ created_at: string }>(
      `SELECT created_at FROM dashboard_users WHERE created_at >= $1 ORDER BY created_at ASC`,
      [fourteenDaysAgo],
    )

    // Build 14-day date series
    const visitors14d: { date: string; count: number }[] = []
    const visitorsByDate: Record<string, number> = {}
    for (const row of visitorRows) {
      const date = String(row.created_at).slice(0, 10)
      if (date) visitorsByDate[date] = (visitorsByDate[date] ?? 0) + 1
    }
    const signupsByDate: Record<string, number> = {}
    for (const row of signupRows) {
      const date = String(row.created_at).slice(0, 10)
      if (date) signupsByDate[date] = (signupsByDate[date] ?? 0) + 1
    }
    for (let i = 13; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      visitors14d.push({ date: key, count: visitorsByDate[key] ?? 0 })
    }
    const signups14d = visitors14d.map(v => ({ date: v.date, count: signupsByDate[v.date] ?? 0 }))
    const totalVisits14d = visitors14d.reduce((s, v) => s + v.count, 0)

    // Membership plan breakdown
    const planRows = await query<{ plan: string; status: string }>(
      `SELECT plan, status FROM memberships LIMIT 500`,
    )
    const planCounts: Record<string, number> = {}
    for (const m of planRows) {
      if (m.status === "active") planCounts[m.plan] = (planCounts[m.plan] ?? 0) + 1
    }

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers:      Number(counts?.total_users      ?? 0),
        verifiedUsers:   Number(counts?.verified_users   ?? 0),
        todaySignups:    Number(counts?.today_signups    ?? 0),
        totalVisits14d,
        totalVipMembers:   Number(counts?.total_vip        ?? 0),
        totalMentorship:   Number(counts?.total_mentorship ?? 0),
        totalUsdtBuy:      Number(counts?.total_usdt_buy   ?? 0),
        totalUsdtSell:     Number(counts?.total_usdt_sell  ?? 0),
        activeMembers:     Number(counts?.total_vip        ?? 0), // keep for backwards compat
      },
      recentSignups,
      visitors14d,
      signups14d,
      planBreakdown: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
    })
  } catch (err) {
    console.error("[analytics] error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
