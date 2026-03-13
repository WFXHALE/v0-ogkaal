import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function inferSection(type: string): string {
  if (type === "usdt_buy")       return "usdt-buy"
  if (type === "usdt_sell")      return "usdt-sell"
  if (type === "usdt")           return "usdt-buy"
  if (type === "suspicious")     return "suspicious"
  if (type === "mentorship")     return "mentorship-requests"
  if (type === "vip_membership") return "vip-requests"
  if (type === "vip_group")      return "vip-requests"
  return "payment-verification"
}

// POST — insert a new notification
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    await query(
      `INSERT INTO admin_notifications (type, title, message, is_read, ref_id)
       VALUES ($1, $2, $3, false, $4)`,
      [b.type ?? "other", b.title ?? null, b.message ?? "", b.ref_id ?? null],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// GET — list all admin notifications newest first
export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 200",
    )
    const normalized = rows.map(n => ({
      id:         n.id,
      type:       n.type,
      title:      n.title ?? "",
      message:    n.message,
      read:       Boolean(n.is_read),
      status:     n.is_read ? "read" : "unread",
      createdAt:  n.created_at,
      refId:      n.ref_id ?? "",
      refSection: (n.ref_id ? inferSection(String(n.type)) : "") as string,
    }))
    return NextResponse.json({ ok: true, data: normalized })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// PATCH — mark one or all notifications read
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.markAll) {
      await query("UPDATE admin_notifications SET is_read = true WHERE is_read = false")
    } else if (body.id) {
      await query("UPDATE admin_notifications SET is_read = true WHERE id = $1", [body.id])
    } else {
      return NextResponse.json({ ok: false, error: "Missing id or markAll" }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

// DELETE — remove a notification permanently
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    await query("DELETE FROM admin_notifications WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
