import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function normalize(r: Record<string, unknown>) {
  return {
    id:             r.id,
    month:          r.month         ?? "",
    year:           Number(r.year   ?? new Date().getFullYear()),
    profitPercent:  Number(r.profit_pct   ?? 0),
    winRate:        Number(r.win_rate     ?? 0),
    totalTrades:    Number(r.total_trades ?? 0),
    wins:           Number(r.wins         ?? 0),
    losses:         Number(r.losses       ?? 0),
    notes:          r.notes ?? null,
    createdAt:      r.created_at,
  }
}

/** GET /api/admin/performance — list all performance stats */
export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM performance_stats ORDER BY year ASC, created_at ASC",
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** POST /api/admin/performance — upsert a performance stat */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.month || !b.year) {
      return NextResponse.json({ ok: false, error: "month and year are required" }, { status: 400 })
    }

    // Upsert: update if month+year already exists, else insert
    const existing = await query(
      "SELECT id FROM performance_stats WHERE month = $1 AND year = $2",
      [b.month, Number(b.year)],
    )

    let rows: Record<string, unknown>[]
    if (existing.length > 0) {
      rows = await query<Record<string, unknown>>(
        `UPDATE performance_stats
         SET profit_pct=$1, win_rate=$2, total_trades=$3, wins=$4, losses=$5, notes=$6
         WHERE month=$7 AND year=$8 RETURNING *`,
        [
          Number(b.profitPercent ?? 0),
          Number(b.winRate       ?? 0),
          Number(b.totalTrades   ?? 0),
          Number(b.wins          ?? 0),
          Number(b.losses        ?? 0),
          b.notes ?? null,
          b.month,
          Number(b.year),
        ],
      )
    } else {
      rows = await query<Record<string, unknown>>(
        `INSERT INTO performance_stats (month, year, profit_pct, win_rate, total_trades, wins, losses, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          b.month,
          Number(b.year),
          Number(b.profitPercent ?? 0),
          Number(b.winRate       ?? 0),
          Number(b.totalTrades   ?? 0),
          Number(b.wins          ?? 0),
          Number(b.losses        ?? 0),
          b.notes ?? null,
        ],
      )
    }

    return NextResponse.json({ ok: true, data: normalize(rows[0]) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

/** DELETE /api/admin/performance — remove a stat */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM performance_stats WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
