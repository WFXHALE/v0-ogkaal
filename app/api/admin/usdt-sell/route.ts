import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

const VALID_STATUSES = ["pending", "paid", "accepted", "processing", "completed", "cancelled", "rejected"]

function normalize(r: Record<string, unknown>) {
  return {
    id:                  r.id,
    userId:              r.user_id              ?? "",
    name:                r.name                 ?? "",
    email:               r.email                ?? "",
    phone:               r.phone                ?? "",
    telegram:            r.telegram             ?? "",
    upiId:               r.upi_id               ?? "",
    upiName:             r.upi_name             ?? "",
    paymentMethodType:   r.payment_method_type  ?? "",
    walletAddress:       r.wallet_address       ?? "",
    usdtAmount:          r.amount_usdt          ?? "",
    txId:                r.transaction_id       ?? "",
    screenshotUrl:       r.screenshot_url       ?? "",
    notificationStatus:  r.notification_status  ?? "UNREAD",
    status:              r.status               ?? "pending",
    createdAt:           r.created_at,
  }
}

export async function GET() {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("usdt_sell_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) throw error
    return NextResponse.json({ ok: true, data: (data ?? []).map(normalize) })
  } catch (err) {
    console.error("[usdt-sell GET]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const db = createServiceClient()
    const { data, error } = await db
      .from("usdt_sell_requests")
      .insert({
        user_id:             b.userId             ?? b.user_id    ?? null,
        name:                b.name               ?? "Sell Request",
        email:               b.email              ?? null,
        phone:               b.phone              ?? null,
        telegram:            b.telegram           ?? null,
        upi_id:              b.upiId              ?? b.upi_id     ?? null,
        upi_name:            b.upiName            ?? b.upi_name   ?? null,
        payment_method_type: b.paymentMethodType  ?? b.payment_method_type ?? null,
        wallet_address:      b.walletAddress      ?? b.wallet_address ?? null,
        amount_usdt:         b.usdtAmount         ?? b.amount_usdt   ?? null,
        transaction_id:      b.txId               ?? b.transaction_id ?? null,
        screenshot_url:      b.screenshotUrl      ?? b.screenshot_url ?? null,
        status:              "pending",
        notification_status: "UNREAD",
      })
      .select("id")
      .single()
    if (error) throw error
    return NextResponse.json({ ok: true, id: data?.id })
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

    const db = createServiceClient()
    const update: Record<string, string> = {}
    if (status)              update.status              = status
    if (notification_status) update.notification_status = notification_status

    if (!Object.keys(update).length) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })
    }

    const { error } = await db.from("usdt_sell_requests").update(update).eq("id", id)
    if (error) throw error
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
    const db = createServiceClient()
    const { error } = await db.from("usdt_sell_requests").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[usdt-sell DELETE]", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
