import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminApi } from "@/lib/require-admin-api"

const VALID_STATUSES = ["pending", "accepted", "processing", "completed", "cancelled", "rejected"]

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 })
    const rows = await query(
      "SELECT * FROM usdt_buy_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500",
      [userId],
    )
    const normalized = rows.map(r => ({
      id:            r.id,
      userId:        r.user_id        ?? "",
      name:          r.name           ?? "",
      email:         r.email          ?? "",
      phone:         r.phone          ?? "",
      walletAddress: r.wallet_address ?? "",
      txId:          r.transaction_id ?? "",
      screenshotUrl: r.screenshot_url ?? "",
      amountUsdt:    r.amount_usdt    ?? "",
      inrEquivalent: r.inr_equivalent ?? "",
      amountPaid:    r.amount_paid    ?? "",
      notificationStatus: r.notification_status ?? "READ",
      status:        r.status         ?? "pending",
      createdAt:     r.created_at,
    }))
    return NextResponse.json({ ok: true, data: normalized })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}


export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.userId || !b.name || !b.amountUsdt) {
      return NextResponse.json({ ok: false, error: "Missing account or trade details" }, { status: 400 })
    }
    const rows = await query(
      `INSERT INTO usdt_buy_requests
         (user_id, name, email, phone, wallet_address, amount_usdt, inr_equivalent, amount_paid, transaction_id, screenshot_url, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending') RETURNING id`,
      [b.userId, b.name, b.email ?? null, b.phone ?? null, b.walletAddress ?? null, b.amountUsdt, b.inrEquivalent ?? null, b.amountPaid ?? null, b.transactionId ?? null, b.screenshotUrl ?? null]
    )
    return NextResponse.json({ ok: true, id: rows[0]?.id ?? null })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
    }
    await query("UPDATE usdt_buy_requests SET status = $1 WHERE id = $2", [status, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdminApi(req)
  if (denied) return denied
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM usdt_buy_requests WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
