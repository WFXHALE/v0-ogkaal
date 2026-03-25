import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function normalize(r: Record<string, unknown>) {
  return {
    id:         r.id,
    pair:       r.pair       ?? "",
    entry:      r.entry      ?? "",
    stopLoss:   r.stop_loss  ?? "",
    takeProfit: r.take_profit ?? "",
    direction:  r.direction  ?? "BUY",
    status:     r.status     ?? "active",
    result:     r.result     ?? null,
    pips:       r.pips       ?? null,
    source:     r.source     ?? null,
    notes:      r.notes      ?? null,
    createdAt:  r.created_at,
  }
}

/** GET /api/admin/signals — list all VIP signals */
export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM vip_signals ORDER BY created_at DESC LIMIT 200",
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** POST /api/admin/signals — create a new signal */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.pair || !b.entry) {
      return NextResponse.json({ ok: false, error: "pair and entry are required" }, { status: 400 })
    }

    const rows = await query<Record<string, unknown>>(
      `INSERT INTO vip_signals (pair, entry, stop_loss, take_profit, direction, status, result, pips, source, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        b.pair,
        b.entry,
        b.stopLoss   ?? b.stop_loss  ?? "",
        b.takeProfit ?? b.take_profit ?? "",
        b.direction  ?? "BUY",
        b.status     ?? "active",
        b.result     ?? null,
        b.pips       ?? null,
        b.source     ?? null,
        b.notes      ?? null,
      ],
    )
    return NextResponse.json({ ok: true, data: normalize(rows[0]) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/admin/signals — update status/result */
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const sets: string[] = []
    const params: unknown[] = []
    const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col} = $${params.length}`) }

    if (b.status     !== undefined) add("status",      b.status)
    if (b.result     !== undefined) add("result",      b.result)
    if (b.pair       !== undefined) add("pair",        b.pair)
    if (b.entry      !== undefined) add("entry",       b.entry)
    if (b.stopLoss   !== undefined) add("stop_loss",   b.stopLoss)
    if (b.takeProfit !== undefined) add("take_profit", b.takeProfit)
    if (b.direction  !== undefined) add("direction",   b.direction)
    if (b.notes      !== undefined) add("notes",       b.notes)

    if (!sets.length) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })

    params.push(b.id)
    const rows = await query<Record<string, unknown>>(
      `UPDATE vip_signals SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params,
    )
    return NextResponse.json({ ok: true, data: rows[0] ? normalize(rows[0]) : null })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** DELETE /api/admin/signals — delete signal permanently */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM vip_signals WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
