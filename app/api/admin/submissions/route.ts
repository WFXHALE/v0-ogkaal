import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

function normalize(r: Record<string, unknown>) {
  return {
    id:                 r.id,
    userId:             r.user_id        ?? "",
    type:               r.type           ?? "other",
    name:               r.name           ?? "",
    email:              r.email          ?? "",
    phone:              r.phone          ?? "",
    telegram:           r.telegram       ?? "",
    paymentMethod:      r.payment_method ?? "",
    amount:             r.amount         ?? "",
    utr:                r.utr            ?? "",
    screenshotUrl:      r.screenshot_url ?? "",
    ipAddress:          r.ip_address     ?? "",
    location:           r.location       ?? "",
    walletAddress:      r.wallet_address ?? "",
    upiId:              r.upi_id         ?? "",
    inrEquivalent:      r.inr_equivalent ?? "",
    amountPaid:         r.amount_paid    ?? "",
    details:            r.details        ?? {},
    status:             r.status         ?? "pending",
    notificationStatus: r.notification_status ?? "READ",
    createdAt:          r.created_at,
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    await query(
      `INSERT INTO admin_submissions
        (type, name, email, phone, telegram, details, status,
         ip_address, location, wallet_address, upi_id,
         inr_equivalent, amount_paid, screenshot_url,
         payment_method, amount, utr, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        b.type           ?? null,
        b.name           ?? null,
        b.email          ?? null,
        b.phone          ?? null,
        b.telegram       ?? null,
        JSON.stringify(b.details ?? {}),
        b.status         ?? "pending",
        b.ip_address     ?? null,
        b.location       ?? null,
        b.wallet_address ?? null,
        b.upi_id         ?? null,
        b.inr_equivalent ?? null,
        b.amount_paid    ?? null,
        b.screenshot_url ?? null,
        b.payment_method ?? b.paymentMethod ?? null,
        b.amount         ?? null,
        b.utr            ?? null,
        b.user_id        ?? b.userId ?? null,
      ],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[submissions POST] error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM admin_submissions ORDER BY created_at DESC LIMIT 500",
    )
    return NextResponse.json({ ok: true, data: rows.map(normalize) })
  } catch (err) {
    console.error("[submissions GET] error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notification_status } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })

    const sets: string[] = []
    const params: unknown[] = []

    if (status) {
      const valid = ["pending", "approved", "rejected", "completed", "dismissed", "deleted"]
      if (!valid.includes(status)) {
        return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
      }
      params.push(status); sets.push(`status = $${params.length}`)
    }
    if (notification_status) {
      params.push(notification_status); sets.push(`notification_status = $${params.length}`)
    }
    if (!sets.length) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })
    }

    params.push(id)
    await query(
      `UPDATE admin_submissions SET ${sets.join(", ")} WHERE id = $${params.length}`,
      params,
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM admin_submissions WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// Suppress unused import warning
void queryOne
