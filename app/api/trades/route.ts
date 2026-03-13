import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET    /api/trades?userId=...    — fetch all trades for a user
// POST   /api/trades               — insert a new trade
// PATCH  /api/trades               — update (close) a trade
// DELETE /api/trades?id=&userId=   — delete a trade

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 })
  try {
    const rows = await query(
      `SELECT * FROM trades WHERE user_id = $1 ORDER BY opened_at DESC`,
      [userId]
    )
    return NextResponse.json({ ok: true, data: rows })
  } catch (e) {
    console.error("[trades GET]", e)
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId, pair, type, entryPrice, exitPrice, stopLoss, takeProfit,
      currentPrice, lotSize, result, profitLoss, notes,
    } = body
    if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 })

    const status    = result === "open" ? "open" : "closed"
    const closedAt  = status === "closed" ? new Date().toISOString() : null

    const rows = await query(
      `INSERT INTO trades
         (user_id, pair, type, entry_price, exit_price, stop_loss, take_profit,
          current_price, lot_size, status, profit_loss, opened_at, closed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),$12)
       RETURNING *`,
      [
        userId, pair, type,
        entryPrice, exitPrice ?? null, stopLoss ?? null, takeProfit ?? null,
        currentPrice ?? null, lotSize ?? 0.01,
        status, profitLoss ?? null, closedAt,
      ]
    )
    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (e) {
    console.error("[trades POST]", e)
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, userId, exitPrice, profitLoss, result, currentPrice } = body
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })

    const newStatus = result && result !== "open" ? "closed" : null
    const rows = await query(
      `UPDATE trades SET
         exit_price    = COALESCE($3, exit_price),
         profit_loss   = COALESCE($4, profit_loss),
         status        = COALESCE($5, status),
         current_price = COALESCE($6, current_price),
         closed_at     = CASE WHEN $5 = 'closed' THEN now() ELSE closed_at END
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, exitPrice ?? null, profitLoss ?? null, newStatus, currentPrice ?? null]
    )
    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (e) {
    console.error("[trades PATCH]", e)
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id     = req.nextUrl.searchParams.get("id")
  const userId = req.nextUrl.searchParams.get("userId")
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
  try {
    await query(`DELETE FROM trades WHERE id = $1 AND user_id = $2`, [id, userId])
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[trades DELETE]", e)
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 })
  }
}
