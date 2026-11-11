import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getDashboardSession } from "@/lib/dashboard-session"

export const runtime = "nodejs"

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized. Please log in again." }, { status: 401 })
}

export async function GET(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return unauthorized()

  try {
    const accountRows = await query(
      "SELECT * FROM trade_accounts WHERE user_id = $1 LIMIT 1",
      [session.sub]
    )
    return NextResponse.json({ ok: true, data: accountRows[0] ?? null })
  } catch (e) {
    console.error("[trade-account GET]", e)
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = getDashboardSession(req)
  if (!session) return unauthorized()

  try {
    const body = await req.json()
    const { broker, platform, balance, dailyProfitTarget, dailyMaxLoss } = body
    const rows = await query(
      `INSERT INTO trade_accounts (user_id, broker, platform, balance, daily_profit_target, daily_max_loss)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         broker = EXCLUDED.broker,
         platform = EXCLUDED.platform,
         balance = EXCLUDED.balance,
         daily_profit_target = EXCLUDED.daily_profit_target,
         daily_max_loss = EXCLUDED.daily_max_loss,
         updated_at = now()
       RETURNING *`,
      [
        session.sub,
        broker ?? "",
        platform ?? "MT5",
        balance ?? 0,
        dailyProfitTarget ?? null,
        dailyMaxLoss ?? null,
      ]
    )
    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (e) {
    console.error("[trade-account POST]", e)
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 })
  }
}
