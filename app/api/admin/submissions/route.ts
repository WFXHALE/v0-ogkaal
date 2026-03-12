import { NextRequest, NextResponse } from "next/server"
import { createClient as _createSupabaseClient } from "@supabase/supabase-js"

// Use the service role key for all admin-submissions writes so they always
// bypass RLS and succeed regardless of auth state.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(`Missing Supabase env vars: url=${!!url} key=${!!key}`)
  }
  return _createSupabaseClient(url, key, { auth: { persistSession: false } })
}

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
    const supabase = createServiceClient()
    const { error } = await supabase.from("admin_submissions").insert({
      type:           body.type           ?? null,
      name:           body.name           ?? null,
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
      payment_method: body.payment_method ?? body.paymentMethod ?? null,
      amount:         body.amount         ?? null,
      utr:            body.utr            ?? null,
      user_id:        body.user_id        ?? body.userId ?? null,
    })
    if (error) {
      const msg = error.message || error.details || error.hint || `code ${error.code}` || "Unknown Supabase error"
      console.error("[submissions POST] Supabase error:", error.code, error.message, error.details)
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[submissions POST] caught:", msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("admin_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) return NextResponse.json({ ok: false, error: error.message ?? JSON.stringify(error) }, { status: 500 })
    return NextResponse.json({ ok: true, data: (data ?? []).map(normalize) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : JSON.stringify(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const supabase = createServiceClient()
    const { error } = await supabase.from("admin_submissions").delete().eq("id", id)
    if (error) return NextResponse.json({ ok: false, error: error.message ?? JSON.stringify(error) }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : JSON.stringify(err) }, { status: 500 })
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
    const supabase = createServiceClient()
    const { error } = await supabase.from("admin_submissions").update({ status }).eq("id", id)
    if (error) return NextResponse.json({ ok: false, error: error.message ?? JSON.stringify(error) }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : JSON.stringify(err) }, { status: 500 })
  }
}
