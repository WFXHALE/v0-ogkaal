import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Normalize snake_case DB row → camelCase for admin panel
function normalize(r: Record<string, unknown>) {
  return {
    id:            r.id,
    userId:        r.user_id       ?? "",
    type:          r.type          ?? "other",
    name:          r.name          ?? "",
    email:         r.email         ?? "",
    phone:         r.phone         ?? "",
    telegram:      r.telegram      ?? "",
    paymentMethod: r.payment_method ?? "",
    amount:        r.amount        ?? "",
    utr:           r.utr           ?? "",
    screenshotUrl: r.screenshot_url ?? "",
    ipAddress:     r.ip_address    ?? "",
    location:      r.location      ?? "",
    walletAddress: r.wallet_address ?? "",
    upiId:         r.upi_id        ?? "",
    inrEquivalent: r.inr_equivalent ?? "",
    amountPaid:    r.amount_paid   ?? "",
    details:       r.details       ?? {},
    status:        r.status        ?? "pending",
    createdAt:     r.created_at,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const { error } = await supabase.from("admin_submissions").insert({
      type:           body.type,
      name:           body.name,
      email:          body.email          ?? null,
      phone:          body.phone          ?? null,
      telegram:       body.telegram       ?? null,
      details:        body.details        ?? {},
      status:         body.status         ?? "pending",
      ip_address:     body.ip_address     ?? null,
      location:       body.location       ?? null,
      wallet_address: body.wallet_address ?? null,
      upi_id:         body.upi_id         ?? null,
      inr_equivalent: body.inr_equivalent ?? null,
      amount_paid:    body.amount_paid    ?? null,
      screenshot_url: body.screenshot_url ?? null,
      payment_method: body.paymentMethod  ?? null,
      amount:         body.amount         ?? null,
      utr:            body.utr            ?? null,
      user_id:        body.userId         ?? null,
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("admin_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) throw error
    return NextResponse.json({ ok: true, data: (data ?? []).map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from("admin_submissions").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 })
    const validStatuses = ["pending", "approved", "rejected", "completed", "dismissed", "deleted"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase.from("admin_submissions").update({ status }).eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
