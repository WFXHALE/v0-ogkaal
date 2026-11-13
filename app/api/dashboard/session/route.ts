import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { getDashboardSession, clearDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) {
    return clearDashboardSession(NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }))
  }

  try {
    const user = await queryOne<Record<string, unknown>>(
      `SELECT id, user_id, email, full_name, created_at, numeric_uid,
              trading_level, market_type, trading_type, years_experience,
              is_verified, kyc_status, avatar_url
       FROM dashboard_users
       WHERE user_id = $1
       LIMIT 1`,
      [session.sub]
    )

    if (!user) {
      return clearDashboardSession(NextResponse.json({ ok: false, error: "Session account not found" }, { status: 401 }))
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: String(user.id),
        user_id: String(user.user_id),
        email: String(user.email),
        full_name: String(user.full_name),
        created_at: user.created_at,
        numeric_uid: user.numeric_uid ?? null,
        trading_level: user.trading_level ?? null,
        market_type: user.market_type ?? null,
        trading_type: user.trading_type ?? null,
        years_experience: user.years_experience ?? null,
        is_verified: Boolean(user.is_verified),
        kyc_status: user.kyc_status ?? "none",
        avatar_url: user.avatar_url ?? null,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (err) {
    console.error("[dashboard session]", err)
    return NextResponse.json({ ok: false, error: "Could not verify session." }, { status: 500 })
  }
}
