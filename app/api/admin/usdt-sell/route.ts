import { NextRequest, NextResponse } from "next/server"
import { createClient as _createSupabaseClient } from "@supabase/supabase-js"

const VALID_STATUSES = ["pending", "accepted", "processing", "completed", "cancelled", "rejected"]

function createServiceClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return _createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("usdt_sell_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) throw error
    // Normalize snake_case → camelCase to match admin panel interface
    const normalized = (data ?? []).map(r => ({
      id:            r.id,
      userId:        r.user_id        ?? "",
      name:          r.name           ?? "",
      email:         r.email          ?? "",
      phone:         r.phone          ?? "",
      telegram:      r.telegram       ?? "",  // column may not exist yet — defaults to ""
      upiId:         r.upi_id         ?? "",
      walletAddress: r.wallet_address ?? "",
      usdtAmount:    r.amount_usdt    ?? "",
      txId:          r.transaction_id ?? "",
      screenshotUrl: r.screenshot_url ?? "",
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
    if (!id || !status) return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 })
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status: ${status}` }, { status: 400 })
    }
    const supabase = createServiceClient()
    const { error } = await supabase.from("usdt_sell_requests").update({ status }).eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const supabase = createServiceClient()
    const { error } = await supabase.from("usdt_sell_requests").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
