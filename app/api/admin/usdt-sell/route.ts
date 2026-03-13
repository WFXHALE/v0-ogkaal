import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

const VALID_STATUSES = ["pending", "accepted", "processing", "completed", "cancelled", "rejected"]

export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM usdt_sell_requests ORDER BY created_at DESC LIMIT 500",
    )
    const normalized = rows.map(r => ({
      id:            r.id,
      userId:        r.user_id        ?? "",
      name:          r.name           ?? "",
      email:         r.email          ?? "",
      phone:         r.phone          ?? "",
      upiId:         r.upi_id         ?? "",
      walletAddress: r.wallet_address ?? "",
      usdtAmount:    r.amount_usdt    ?? "",
      txId:          r.transaction_id ?? "",
      screenshotUrl: r.screenshot_url ?? "",
      notificationStatus: r.notification_status ?? "READ",
      status:        r.status         ?? "pending",
      createdAt:     r.created_at,
    }))
    return NextResponse.json({ ok: true, data: normalized })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
    }
    await query("UPDATE usdt_sell_requests SET status = $1 WHERE id = $2", [status, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM usdt_sell_requests WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
