import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// POST /api/trades  — create a new trade
// PATCH /api/trades — update (close) a trade
// DELETE /api/trades?id=... — delete a trade

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId, accountId, pair, type, entryPrice, stopLoss, takeProfit,
      currentPrice, lotSize, status, profitLoss, exitPrice,
    } = body
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const res = await query(
      `INSERT INTO trades
         (user_id, account_id, pair, type, entry_price, stop_loss, take_profit,
          current_price, lot_size, status, profit_loss, exit_price, opened_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
       RETURNING *`,
      [
        userId, accountId ?? null, pair, type,
        entryPrice, stopLoss ?? null, takeProfit ?? null,
        currentPrice ?? null, lotSize ?? 0.01,
        status ?? "open", profitLoss ?? null, exitPrice ?? null,
      ]
    )
    return NextResponse.json({ ok: true, data: res.rows[0] })
  } catch (e) {
    console.error("[trades POST]", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, exitPrice, profitLoss, status, currentPrice, stopLoss, takeProfit } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const res = await query(
      `UPDATE trades SET
         exit_price    = COALESCE($2, exit_price),
         profit_loss   = COALESCE($3, profit_loss),
         status        = COALESCE($4, status),
         current_price = COALESCE($5, current_price),
         stop_loss     = COALESCE($6, stop_loss),
         take_profit   = COALESCE($7, take_profit),
         closed_at     = CASE WHEN $4 IN ('win','loss') THEN now() ELSE closed_at END
       WHERE id = $1
       RETURNING *`,
      [id, exitPrice ?? null, profitLoss ?? null, status ?? null, currentPrice ?? null, stopLoss ?? null, takeProfit ?? null]
    )
    return NextResponse.json({ ok: true, data: res.rows[0] })
  } catch (e) {
    console.error("[trades PATCH]", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    await query(`DELETE FROM trades WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[trades DELETE]", e)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }
}
