import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

/**
 * USDT Sell Requests API — backed by lib/db (pg over IPv4 pooler).
 * Uses raw SQL so it works in the preview sandbox where Supabase REST
 * DNS resolution fails (ENOTFOUND supabase.co).
 */

const VALID_STATUSES = ["pending","paid","accepted","processing","completed","cancelled","rejected"]

function normalize(r: Record<string, unknown>) {
  return {
    id:                 r.id,
    userId:             r.user_id             ?? "",
    name:               r.name                ?? "",
    email:              r.email               ?? "",
    phone:              r.phone               ?? "",
    telegram:           r.telegram            ?? "",
    upiId:              r.upi_id              ?? "",
    upiName:            r.upi_name            ?? "",
    paymentMethodType:  r.payment_method_type ?? "",
    walletAddress:      r.wallet_address      ?? "",
    usdtAmount:         r.amount_usdt         ?? "",
    txId:               r.transaction_id      ?? "",
    screenshotUrl:      r.screenshot_url      ?? "",
    notificationStatus: r.notification_status ?? "UNREAD",
    status:             r.status              ?? "pending",
    createdAt:          r.created_at,
  }
}

export async function GET() {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM usdt_sell_requests ORDER BY created_at DESC LIMIT 500`
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    console.error("[usdt-sell GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const row = await queryOne<{ id: string }>(
      `INSERT INTO usdt_sell_requests
         (user_id, name, email, phone, telegram, upi_id, upi_name,
          payment_method_type, wallet_address, amount_usdt,
          transaction_id, screenshot_url, status, notification_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending','UNREAD')
       RETURNING id`,
      [
        b.userId             ?? b.user_id            ?? null,
        b.name               ?? "Sell Request",
        b.email              ?? null,
        b.phone              ?? null,
        b.telegram           ?? null,
        b.upiId              ?? b.upi_id             ?? null,
        b.upiName            ?? b.upi_name           ?? null,
        b.paymentMethodType  ?? b.payment_method_type ?? null,
        b.walletAddress      ?? b.wallet_address     ?? null,
        b.usdtAmount         ?? b.amount_usdt        ?? null,
        b.txId               ?? b.transaction_id     ?? null,
        b.screenshotUrl      ?? b.screenshot_url     ?? null,
      ]
    )
    return NextResponse.json({ ok: true, id: row?.id ?? null })
  } catch (err) {
    console.error("[usdt-sell POST]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notification_status } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
    }

    const sets: string[]  = []
    const vals: unknown[] = []
    let   idx             = 1

    if (status)              { sets.push(`status=$${idx++}`);              vals.push(status) }
    if (notification_status) { sets.push(`notification_status=$${idx++}`); vals.push(notification_status) }

    if (!sets.length) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })

    vals.push(id)
    await query(`UPDATE usdt_sell_requests SET ${sets.join(",")} WHERE id=$${idx}`, vals)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[usdt-sell PATCH]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query(`DELETE FROM usdt_sell_requests WHERE id=$1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[usdt-sell DELETE]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
