import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET  /api/trade-account?userId=...   — fetch account + open trades + history
// POST /api/trade-account              — upsert account settings
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const accountRows = await query(
      `SELECT * FROM trade_accounts WHERE user_id = $1 LIMIT 1`,
      [userId]
    )
    const account = accountRows[0] ?? null

    const openTrades = await query(
      `SELECT * FROM trades WHERE user_id = $1 AND result = 'open' ORDER BY date DESC`,
      [userId]
    )
    const history = await query(
      `SELECT * FROM trades WHERE user_id = $1 AND result != 'open' ORDER BY date DESC`,
      [userId]
    )

    return NextResponse.json({ ok: true, data: account, openTrades, history })
  } catch (e) {
    console.error("[trade-account GET]", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, broker, platform, balance, dailyProfitTarget, dailyMaxLoss } = body
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const rows = await query(
      `INSERT INTO trade_accounts (user_id, broker, platform, balance, daily_profit_target, daily_max_loss)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         broker               = EXCLUDED.broker,
         platform             = EXCLUDED.platform,
         balance              = EXCLUDED.balance,
         daily_profit_target  = EXCLUDED.daily_profit_target,
         daily_max_loss       = EXCLUDED.daily_max_loss,
         updated_at           = now()
       RETURNING *`,
      [userId, broker ?? "", platform ?? "MT5", balance ?? 0, dailyProfitTarget ?? 0, dailyMaxLoss ?? 0]
    )
    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (e) {
    console.error("[trade-account POST]", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}
